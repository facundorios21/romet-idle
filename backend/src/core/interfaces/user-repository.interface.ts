import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
  updateCoins(id: number, coins: number): Promise<User>;
  updateLastClaim(id: number, lastClaim: Date): Promise<User>;
  addCoins(id: number, amount: number): Promise<User>;
}

export const IUserRepositoryToken = Symbol('IUserRepository');
