import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import type { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';
import type { IPackRepository } from '../../core/interfaces/pack-repository.interface';
import { Card } from '../../core/entities/card.entity';

@Injectable()
export class BuyPackUseCase {
  private readonly SPECIAL_PROBABILITY = 5; // 5% de probabilidad de que una carta sea especial/shiny

  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
    @Inject(ICardRepositoryToken)
    private readonly cardRepository: ICardRepository,
    @Inject(IUserCardRepositoryToken)
    private readonly userCardRepository: IUserCardRepository,
    @Inject(IPackRepositoryToken)
    private readonly packRepository: IPackRepository,
  ) {}

  async execute(userId: number, packType: string) {
    const pack = await this.packRepository.findById(packType.toLowerCase());
    if (!pack) {
      throw new BadRequestException('Tipo de sobre no válido.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.coins < pack.cost) {
      throw new BadRequestException('Esencias insuficientes para comprar este sobre.');
    }

    // Cargar todas las cartas para organizarlas por rareza
    const allCards = await this.cardRepository.findAll();
    if (allCards.length === 0) {
      throw new BadRequestException('No hay cartas registradas en el sistema. Asegúrate de correr el seed.');
    }

    const pools: Record<string, Card[]> = {
      COMMON: [],
      RARE: [],
      EPIC: [],
      LEGENDARY: [],
      MYTHIC: [],
    };

    for (const card of allCards) {
      if (pools[card.rarity]) {
        pools[card.rarity].push(card);
      }
    }

    const rolledCards: { card: Card; isSpecial: boolean }[] = [];
    const probabilities = {
      COMMON: pack.probCommon,
      RARE: pack.probRare,
      EPIC: pack.probEpic,
      LEGENDARY: pack.probLegendary,
      MYTHIC: pack.probMythic,
    };

    // Tirar cartas
    for (let i = 0; i < pack.cardsCount; i++) {
      const rarity = this.rollRarity(probabilities);

      // Si el pool de la rareza elegida está vacío, usar un fallback
      let pool = pools[rarity];
      if (pool.length === 0) {
        const availableRarities = Object.keys(pools).filter((r) => pools[r].length > 0);
        if (availableRarities.length === 0) {
          throw new BadRequestException('No hay cartas registradas en ningún pool.');
        }
        const fallbackRarity = availableRarities[0];
        pool = pools[fallbackRarity];
      }

      const randomCard = pool[Math.floor(Math.random() * pool.length)];
      const isSpecial = Math.floor(Math.random() * 100) < this.SPECIAL_PROBABILITY;

      rolledCards.push({ card: randomCard, isSpecial });
    }

    // Restar monedas y persistir inventario
    await this.userRepository.updateCoins(userId, user.coins - pack.cost);

    for (const roll of rolledCards) {
      const existingCard = await this.userCardRepository.findByUserCardAndSpecial(userId, roll.card.id, roll.isSpecial);
      if (existingCard) {
        await this.userCardRepository.incrementCardCount(userId, roll.card.id, roll.isSpecial, 1);
      } else {
        await this.userCardRepository.addCardToUser(userId, roll.card.id, roll.isSpecial);
      }
    }

    return {
      packType,
      cost: pack.cost,
      coinsRemaining: user.coins - pack.cost,
      cards: rolledCards,
    };
  }

  private rollRarity(probabilities: Record<string, number>): string {
    const roll = Math.random() * 100;
    let sum = 0;

    for (const [rarity, prob] of Object.entries(probabilities)) {
      sum += prob;
      if (roll <= sum) {
        return rarity;
      }
    }

    return 'COMMON'; // Fallback por defecto
  }
}

