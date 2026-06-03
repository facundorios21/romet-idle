import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import type { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';

export interface SacrificedCardDto {
  cardId: string;
  isSpecial: boolean;
  quantity: number;
}

@Injectable()
export class UpgraderUseCase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
    @Inject(IUserCardRepositoryToken)
    private readonly userCardRepository: IUserCardRepository,
    @Inject(ICardRepositoryToken)
    private readonly cardRepository: ICardRepository,
    @InjectRepository(RarityEntity)
    private readonly rarityRepository: Repository<RarityEntity>,
  ) {}

  async execute(
    userId: string,
    sacrificedCards: SacrificedCardDto[],
    targetCardId: string,
  ) {
    if (!sacrificedCards || sacrificedCards.length === 0) {
      throw new BadRequestException('Debes ofrecer al menos una carta para la transmutación.');
    }

    // 1. Obtener todas las cartas disponibles en el juego para verificar rarezas
    const allCards = await this.cardRepository.findAll();
    const cardsMap = new Map(allCards.map((c) => [c.id, c]));

    const targetCard = cardsMap.get(targetCardId);
    if (!targetCard) {
      throw new NotFoundException('La carta objetivo no existe.');
    }

    // Obtener los pesos dinámicos de las rarezas directamente de la base de datos
    const rarities = await this.rarityRepository.find();
    const rarityWeights = new Map(rarities.map((r) => [r.id.toUpperCase(), r.weight]));

    // 2. Validar inventario de cartas a sacrificar y calcular peso
    let totalSacrificedWeight = 0;
    const userCardsToUpdate: { userCard: any; quantity: number }[] = [];

    for (const sac of sacrificedCards) {
      const dbCard = cardsMap.get(sac.cardId);
      if (!dbCard) {
        throw new NotFoundException(`La carta a sacrificar con ID ${sac.cardId} no existe.`);
      }

      const userCard = await this.userCardRepository.findByUserCardAndSpecial(
        userId,
        sac.cardId,
        sac.isSpecial,
      );

      if (!userCard || userCard.count < sac.quantity) {
        throw new BadRequestException(
          `Copias insuficientes para sacrificar de la carta ${dbCard.name}. Requerido: ${sac.quantity}, en inventario: ${userCard ? userCard.count : 0}`,
        );
      }

      const weight = rarityWeights.get(dbCard.rarity.toUpperCase()) ?? 1;
      totalSacrificedWeight += weight * sac.quantity;
      userCardsToUpdate.push({ userCard, quantity: sac.quantity });
    }

    const targetWeight = rarityWeights.get(targetCard.rarity.toUpperCase()) ?? 1;

    // 3. Calcular probabilidad de éxito
    // Por ejemplo: 3 comunes (peso = 3) para obtener 1 rara (peso = 3) -> (3/3) * 0.7 = 70%
    const baseProb = (totalSacrificedWeight / targetWeight) * 0.7;
    // Capped entre 1% y 95% para mantener la apuesta emocionante
    const probability = Math.min(0.95, Math.max(0.01, baseProb));

    // 4. Ejecutar la apuesta
    const roll = Math.random();
    const success = roll <= probability;

    // 5. Restar las cartas sacrificadas
    for (const update of userCardsToUpdate) {
      const uc = update.userCard;
      const newCount = uc.count - update.quantity;
      await this.userCardRepository.updateCardLevelAndCount(
        userId,
        uc.cardId,
        uc.isSpecial,
        newCount,
        uc.level || 1,
      );
    }

    let obtainedOrbs = 0;
    let userCoinsAfter = 0;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (success) {
      // Éxito: Agregar carta objetivo al inventario (Normal)
      const targetUserCard = await this.userCardRepository.findByUserCardAndSpecial(
        userId,
        targetCardId,
        false,
      );

      if (targetUserCard) {
        await this.userCardRepository.incrementCardCount(userId, targetCardId, false, 1);
      } else {
        await this.userCardRepository.addCardToUser(userId, targetCardId, false);
      }
      userCoinsAfter = user.coins;
    } else {
      // Fallo: Dar una pequeña cantidad de orbes de compensación
      obtainedOrbs = Math.round(totalSacrificedWeight * 15);
      userCoinsAfter = user.coins + obtainedOrbs;
      await this.userRepository.updateCoins(userId, userCoinsAfter);
    }

    return {
      success,
      probability,
      roll,
      obtainedOrbs,
      userCoinsAfter,
      targetCard,
    };
  }
}
