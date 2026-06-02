import { UserCard } from './user-card.entity';

export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly coins: number,
    public readonly lastClaim: Date,
    public readonly role: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly inventory?: UserCard[],
  ) {}
}

