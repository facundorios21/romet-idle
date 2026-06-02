import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUserRepository } from './prisma-user.repository';
import { PrismaCardRepository } from './prisma-card.repository';
import { PrismaUserCardRepository } from './prisma-user-card.repository';
import { PrismaPackRepository } from './prisma-pack.repository';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: PrismaUserRepository,
    },
    {
      provide: ICardRepositoryToken,
      useClass: PrismaCardRepository,
    },
    {
      provide: IUserCardRepositoryToken,
      useClass: PrismaUserCardRepository,
    },
    {
      provide: IPackRepositoryToken,
      useClass: PrismaPackRepository,
    },
  ],
  exports: [
    IUserRepositoryToken,
    ICardRepositoryToken,
    IUserCardRepositoryToken,
    IPackRepositoryToken,
  ],
})
export class RepositoriesModule {}

