import { Card } from '../entities/card.entity';

export interface ICardRepository {
  findById(id: string): Promise<Card | null>;
  findAll(): Promise<Card[]>;
  findByRarity(rarity: string): Promise<Card[]>;
  save(card: Card): Promise<Card>;
}

export const ICardRepositoryToken = Symbol('ICardRepository');

