import { UserCard } from '../entities/user-card.entity';

export interface IUserCardRepository {
  findByUser(userId: number): Promise<UserCard[]>;
  addCardToUser(userId: number, cardId: string, isSpecial: boolean): Promise<UserCard>;
  incrementCardCount(userId: number, cardId: string, isSpecial: boolean, count: number): Promise<UserCard>;
  findByUserCardAndSpecial(userId: number, cardId: string, isSpecial: boolean): Promise<UserCard | null>;
  updateCardLevelAndCount(userId: number, cardId: string, isSpecial: boolean, count: number, level: number): Promise<UserCard>;
}

export const IUserCardRepositoryToken = Symbol('IUserCardRepository');
