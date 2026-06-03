import { UserCard } from '../entities/user-card.entity';

export interface IUserCardRepository {
  findByUser(userId: string): Promise<UserCard[]>;
  addCardToUser(userId: string, cardId: string, isSpecial: boolean): Promise<UserCard>;
  incrementCardCount(userId: string, cardId: string, isSpecial: boolean, count: number): Promise<UserCard>;
  findByUserCardAndSpecial(userId: string, cardId: string, isSpecial: boolean): Promise<UserCard | null>;
  updateCardLevelAndCount(userId: string, cardId: string, isSpecial: boolean, count: number, level: number): Promise<UserCard>;
}

export const IUserCardRepositoryToken = Symbol('IUserCardRepository');
