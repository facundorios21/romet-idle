import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
  updateCoins(id: string, coins: number): Promise<User>;
  updateLastClaim(id: string, lastClaim: Date): Promise<User>;
  addCoins(id: string, amount: number): Promise<User>;
}

export const IUserRepositoryToken = Symbol('IUserRepository');
