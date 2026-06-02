import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../core/interfaces/user-repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../core/entities/user.entity';
import { PrismaMapper } from './prisma-mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            card: true,
          },
        },
      },
    });
    return user ? PrismaMapper.toUserDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        inventory: {
          include: {
            card: true,
          },
        },
      },
    });
    return user ? PrismaMapper.toUserDomain(user) : null;
  }

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
      },
    });
    return PrismaMapper.toUserDomain(user);
  }

  async updateCoins(id: number, coins: number): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { coins },
    });
    return PrismaMapper.toUserDomain(user);
  }

  async updateLastClaim(id: number, lastClaim: Date): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { lastClaim },
    });
    return PrismaMapper.toUserDomain(user);
  }

  async addCoins(id: number, amount: number): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        coins: {
          increment: amount,
        },
      },
    });
    return PrismaMapper.toUserDomain(user);
  }
}
