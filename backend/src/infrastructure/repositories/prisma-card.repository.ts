import { Injectable } from '@nestjs/common';
import { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Card } from '../../core/entities/card.entity';
import { PrismaMapper } from './prisma-mapper';

@Injectable()
export class PrismaCardRepository implements ICardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Card | null> {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });
    return card ? PrismaMapper.toCardDomain(card) : null;
  }

  async findAll(): Promise<Card[]> {
    const cards = await this.prisma.card.findMany();
    return cards.map(c => PrismaMapper.toCardDomain(c));
  }

  async findByRarity(rarity: string): Promise<Card[]> {
    const cards = await this.prisma.card.findMany({
      where: { rarity },
    });
    return cards.map(c => PrismaMapper.toCardDomain(c));
  }

  async save(card: Card): Promise<Card> {
    const upserted = await this.prisma.card.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        description: card.description,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        power: card.power,
        element: card.element,
        set: card.set,
      },
      create: {
        id: card.id,
        name: card.name,
        description: card.description,
        imageUrl: card.imageUrl,
        rarity: card.rarity,
        power: card.power,
        element: card.element,
        set: card.set,
      },
    });
    return PrismaMapper.toCardDomain(upserted);
  }
}

