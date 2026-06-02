import { Injectable, Inject } from '@nestjs/common';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import type { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';

@Injectable()
export class GetCollectionUseCase {
  constructor(
    @Inject(ICardRepositoryToken)
    private readonly cardRepository: ICardRepository,
    @Inject(IUserCardRepositoryToken)
    private readonly userCardRepository: IUserCardRepository,
  ) {}

  async execute(userId: number) {
    const allCards = await this.cardRepository.findAll();
    const userInventory = await this.userCardRepository.findByUser(userId);

    // Mapear el inventario del usuario para acceso rápido: cardId -> { countNormal, countSpecial }
    const inventoryMap = new Map<string, { countNormal: number; countSpecial: number }>();
    for (const uc of userInventory) {
      const existing = inventoryMap.get(uc.cardId) || { countNormal: 0, countSpecial: 0 };
      if (uc.isSpecial) {
        existing.countSpecial += uc.count;
      } else {
        existing.countNormal += uc.count;
      }
      inventoryMap.set(uc.cardId, existing);
    }

    let collectedUniqueCount = 0;
    const cards = allCards.map((card) => {
      const owned = inventoryMap.get(card.id);
      const isOwned = !!owned;
      if (isOwned) {
        collectedUniqueCount++;
      }

      return {
        ...card,
        owned: isOwned,
        countNormal: owned ? owned.countNormal : 0,
        countSpecial: owned ? owned.countSpecial : 0,
      };
    });

    const totalCards = allCards.length;
    const completionPercentage = totalCards > 0 ? Math.round((collectedUniqueCount / totalCards) * 100) : 0;

    return {
      stats: {
        totalCards,
        collectedUnique: collectedUniqueCount,
        completionPercentage,
      },
      cards,
    };
  }
}
