import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { UserEntity } from '../typeorm/entities/user.entity';
import { User } from '../../core/entities/user.entity';
import { TypeOrmMapper } from './typeorm-mapper';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { id },
      relations: ['inventory', 'inventory.card'],
    });
    return user ? TypeOrmMapper.toUserDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.repository.findOne({
      where: { email },
      relations: ['inventory', 'inventory.card'],
    });
    return user ? TypeOrmMapper.toUserDomain(user) : null;
  }

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    const user = this.repository.create({
      username,
      email,
      password: passwordHash,
    });
    const saved = await this.repository.save(user);
    return TypeOrmMapper.toUserDomain(saved);
  }

  async updateCoins(id: string, coins: number): Promise<User> {
    await this.repository.update(id, { coins });
    const user = await this.findById(id);
    if (!user) throw new Error(`User with id ${id} not found after coins update`);
    return user;
  }

  async updateLastClaim(id: string, lastClaim: Date): Promise<User> {
    await this.repository.update(id, { lastClaim });
    const user = await this.findById(id);
    if (!user) throw new Error(`User with id ${id} not found after lastClaim update`);
    return user;
  }

  async addCoins(id: string, amount: number): Promise<User> {
    await this.repository.increment({ id }, 'coins', amount);
    const user = await this.findById(id);
    if (!user) throw new Error(`User with id ${id} not found after adding coins`);
    return user;
  }
}
