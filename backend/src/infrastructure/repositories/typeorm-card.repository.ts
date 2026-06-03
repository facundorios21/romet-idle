import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { CardEntity } from '../typeorm/entities/card.entity';
import { Card } from '../../core/entities/card.entity';
import { TypeOrmMapper } from './typeorm-mapper';

@Injectable()
export class TypeOrmCardRepository implements ICardRepository {
  constructor(
    @InjectRepository(CardEntity)
    private readonly repository: Repository<CardEntity>,
  ) {}

  async findById(id: string): Promise<Card | null> {
    const card = await this.repository.findOne({
      where: { id },
    });
    return card ? TypeOrmMapper.toCardDomain(card) : null;
  }

  async findAll(): Promise<Card[]> {
    const cards = await this.repository.find();
    return cards.map(c => TypeOrmMapper.toCardDomain(c));
  }

  async findByRarity(rarity: string): Promise<Card[]> {
    const cards = await this.repository.find({
      where: { rarity },
    });
    return cards.map(c => TypeOrmMapper.toCardDomain(c));
  }

  async save(card: Card): Promise<Card> {
    const cardEntity = this.repository.create({
      id: card.id,
      name: card.name,
      description: card.description,
      imageUrl: card.imageUrl,
      rarity: card.rarity,
      power: card.power,
      element: card.element,
      set: card.set,
    });
    const saved = await this.repository.save(cardEntity);
    return TypeOrmMapper.toCardDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
