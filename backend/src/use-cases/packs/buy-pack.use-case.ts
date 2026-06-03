import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import type { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';
import type { IPackRepository } from '../../core/interfaces/pack-repository.interface';
import { Card } from '../../core/entities/card.entity';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';

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
    @InjectRepository(RarityEntity)
    private readonly rarityRepository: Repository<RarityEntity>,
  ) {}

  async execute(userId: string, packType: string) {
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

    const rarities = await this.rarityRepository.find();
    const rarityToPoolMap = new Map<string, string>();
    for (const r of rarities) {
      const nameNorm = r.name.toLowerCase();
      if (nameNorm.includes('común') || nameNorm.includes('comun') || nameNorm.includes('common')) {
        rarityToPoolMap.set(r.id.toUpperCase(), 'COMMON');
      } else if (nameNorm.includes('raro') || nameNorm.includes('rare')) {
        rarityToPoolMap.set(r.id.toUpperCase(), 'RARE');
      } else if (nameNorm.includes('épico') || nameNorm.includes('epico') || nameNorm.includes('epic')) {
        rarityToPoolMap.set(r.id.toUpperCase(), 'EPIC');
      } else if (nameNorm.includes('legendario') || nameNorm.includes('legendary')) {
        rarityToPoolMap.set(r.id.toUpperCase(), 'LEGENDARY');
      } else if (nameNorm.includes('mítico') || nameNorm.includes('mitico') || nameNorm.includes('mythic')) {
        rarityToPoolMap.set(r.id.toUpperCase(), 'MYTHIC');
      }
    }

    const pools: Record<string, Card[]> = {
      COMMON: [],
      RARE: [],
      EPIC: [],
      LEGENDARY: [],
      MYTHIC: [],
    };

    for (const card of allCards) {
      const mappedPool = rarityToPoolMap.get(card.rarity.toUpperCase()) ?? 'COMMON';
      if (pools[mappedPool]) {
        pools[mappedPool].push(card);
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

