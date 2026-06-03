import { Card } from './card.entity';

export class UserCard {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly cardId: string,
    public readonly count: number,
    public readonly level: number,
    public readonly isSpecial: boolean,
    public readonly card?: Card,
  ) {}
}
