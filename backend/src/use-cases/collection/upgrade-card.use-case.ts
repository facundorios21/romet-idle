import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import type { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';

@Injectable()
export class UpgradeCardUseCase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
    @Inject(IUserCardRepositoryToken)
    private readonly userCardRepository: IUserCardRepository,
  ) {}

  async execute(userId: string, cardId: string, isSpecial: boolean) {
    // 1. Obtener la carta del inventario del usuario
    const userCard = await this.userCardRepository.findByUserCardAndSpecial(userId, cardId, isSpecial);
    if (!userCard) {
      throw new NotFoundException('Carta no encontrada en tu inventario.');
    }

    const currentLevel = userCard.level || 1;
    const currentCount = userCard.count;

    // 2. Regla de crafteo: Costo de duplicados = currentLevel
    // Se requiere tener al menos currentLevel + 1 copias para poder mejorar y que quede al menos 1
    const requiredCount = currentLevel + 1;
    if (currentCount < requiredCount) {
      throw new BadRequestException(
        `Copias insuficientes para mejorar. Tienes ${currentCount} y necesitas al menos ${requiredCount} copias.`,
      );
    }

    // 3. Regla de costo en monedas: currentLevel * 100
    const coinCost = currentLevel * 100;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.coins < coinCost) {
      throw new BadRequestException(
        `Monedas insuficientes. Costo: ${coinCost} esencias, tienes ${user.coins.toFixed(0)}.`,
      );
    }

    // 4. Procesar la mejora:
    // - Restar monedas
    // - Consumir copias (newCount = currentCount - currentLevel)
    // - Incrementar nivel (newLevel = currentLevel + 1)
    const newCount = currentCount - currentLevel;
    const newLevel = currentLevel + 1;

    await this.userRepository.updateCoins(userId, user.coins - coinCost);
    const updatedUserCard = await this.userCardRepository.updateCardLevelAndCount(
      userId,
      cardId,
      isSpecial,
      newCount,
      newLevel,
    );

    return {
      message: 'Mejora realizada con éxito.',
      newLevel,
      newCount,
      coinCost,
      coinsRemaining: user.coins - coinCost,
      userCard: updatedUserCard,
    };
  }
}
