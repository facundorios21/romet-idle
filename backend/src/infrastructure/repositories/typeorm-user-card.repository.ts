import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserCardRepository } from '../../core/interfaces/user-card-repository.interface';
import { UserCardEntity } from '../typeorm/entities/user-card.entity';
import { UserCard } from '../../core/entities/user-card.entity';
import { TypeOrmMapper } from './typeorm-mapper';

@Injectable()
export class TypeOrmUserCardRepository implements IUserCardRepository {
  constructor(
    @InjectRepository(UserCardEntity)
    private readonly repository: Repository<UserCardEntity>,
  ) {}

  async findByUser(userId: string): Promise<UserCard[]> {
    const userCards = await this.repository.find({
      where: { userId },
      relations: ['card'],
    });
    return userCards.map(uc => TypeOrmMapper.toUserCardDomain(uc));
  }

  async findByUserCardAndSpecial(userId: string, cardId: string, isSpecial: boolean): Promise<UserCard | null> {
    const userCard = await this.repository.findOne({
      where: { userId, cardId, isSpecial },
      relations: ['card'],
    });
    return userCard ? TypeOrmMapper.toUserCardDomain(userCard) : null;
  }

  async addCardToUser(userId: string, cardId: string, isSpecial: boolean): Promise<UserCard> {
    const userCard = this.repository.create({
      userId,
      cardId,
      isSpecial,
      count: 1,
    });
    const saved = await this.repository.save(userCard);
    const refetched = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['card'],
    });
    if (!refetched) throw new Error('Refetch of userCard failed');
    return TypeOrmMapper.toUserCardDomain(refetched);
  }

  async incrementCardCount(userId: string, cardId: string, isSpecial: boolean, count: number): Promise<UserCard> {
    const userCard = await this.repository.findOne({
      where: { userId, cardId, isSpecial },
    });
    if (!userCard) throw new Error('UserCard not found to increment');
    userCard.count += count;
    await this.repository.save(userCard);
    const refetched = await this.repository.findOne({
      where: { id: userCard.id },
      relations: ['card'],
    });
    if (!refetched) throw new Error('Refetch of userCard failed');
    return TypeOrmMapper.toUserCardDomain(refetched);
  }

  async updateCardLevelAndCount(userId: string, cardId: string, isSpecial: boolean, count: number, level: number): Promise<UserCard> {
    const userCard = await this.repository.findOne({
      where: { userId, cardId, isSpecial },
    });
    if (!userCard) throw new Error('UserCard not found to update');
    userCard.count = count;
    userCard.level = level;
    await this.repository.save(userCard);
    const refetched = await this.repository.findOne({
      where: { id: userCard.id },
      relations: ['card'],
    });
    if (!refetched) throw new Error('Refetch of userCard failed');
    return TypeOrmMapper.toUserCardDomain(refetched);
  }
}
