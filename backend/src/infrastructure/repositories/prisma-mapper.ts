import { User as PrismaUser, Card as PrismaCard, UserCard as PrismaUserCard, Pack as PrismaPack } from '@prisma/client';
import { User } from '../../core/entities/user.entity';
import { Card } from '../../core/entities/card.entity';
import { UserCard } from '../../core/entities/user-card.entity';
import { Pack } from '../../core/entities/pack.entity';

export class PrismaMapper {
  static toUserDomain(prismaUser: PrismaUser & { inventory?: (PrismaUserCard & { card?: PrismaCard })[] }): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.username,
      prismaUser.password,
      prismaUser.coins,
      prismaUser.lastClaim,
      prismaUser.role,
      prismaUser.createdAt,
      prismaUser.updatedAt,
      prismaUser.inventory ? prismaUser.inventory.map(uc => this.toUserCardDomain(uc)) : [],
    );
  }

  static toCardDomain(prismaCard: PrismaCard): Card {
    return new Card(
      prismaCard.id,
      prismaCard.name,
      prismaCard.description,
      prismaCard.imageUrl,
      prismaCard.rarity,
      prismaCard.power,
      prismaCard.element,
      prismaCard.set,
    );
  }

  static toUserCardDomain(prismaUserCard: PrismaUserCard & { card?: PrismaCard }): UserCard {
    return new UserCard(
      prismaUserCard.id,
      prismaUserCard.userId,
      prismaUserCard.cardId,
      prismaUserCard.count,
      prismaUserCard.isSpecial,
      prismaUserCard.card ? this.toCardDomain(prismaUserCard.card) : undefined,
    );
  }

  static toPackDomain(prismaPack: PrismaPack): Pack {
    return new Pack(
      prismaPack.id,
      prismaPack.name,
      prismaPack.cost,
      prismaPack.cardsCount,
      prismaPack.probCommon,
      prismaPack.probRare,
      prismaPack.probEpic,
      prismaPack.probLegendary,
      prismaPack.probMythic,
    );
  }
}

