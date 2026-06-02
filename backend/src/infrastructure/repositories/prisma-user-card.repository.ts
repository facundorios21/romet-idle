import { Injectable } from '@nestjs/common';
import { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UserCard } from '../../core/entities/user-card.entity';
import { PrismaMapper } from './prisma-mapper';

@Injectable()
export class PrismaUserCardRepository implements IUserCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: number): Promise<UserCard[]> {
    const userCards = await this.prisma.userCard.findMany({
      where: { userId },
      include: {
        card: true,
      },
    });
    return userCards.map(uc => PrismaMapper.toUserCardDomain(uc));
  }

  async findByUserCardAndSpecial(userId: number, cardId: string, isSpecial: boolean): Promise<UserCard | null> {
    const userCard = await this.prisma.userCard.findUnique({
      where: {
        userId_cardId_isSpecial: {
          userId,
          cardId,
          isSpecial,
        },
      },
      include: {
        card: true,
      },
    });
    return userCard ? PrismaMapper.toUserCardDomain(userCard) : null;
  }

  async addCardToUser(userId: number, cardId: string, isSpecial: boolean): Promise<UserCard> {
    const userCard = await this.prisma.userCard.create({
      data: {
        userId,
        cardId,
        isSpecial,
        count: 1,
      },
      include: {
        card: true,
      },
    });
    return PrismaMapper.toUserCardDomain(userCard);
  }

  async incrementCardCount(userId: number, cardId: string, isSpecial: boolean, count: number): Promise<UserCard> {
    const userCard = await this.prisma.userCard.update({
      where: {
        userId_cardId_isSpecial: {
          userId,
          cardId,
          isSpecial,
        },
      },
      data: {
        count: {
          increment: count,
        },
      },
      include: {
        card: true,
      },
    });
    return PrismaMapper.toUserCardDomain(userCard);
  }
}
