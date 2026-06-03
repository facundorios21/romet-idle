import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../typeorm/entities/user.entity';
import { CardEntity } from '../typeorm/entities/card.entity';
import { UserCardEntity } from '../typeorm/entities/user-card.entity';
import { PackEntity } from '../typeorm/entities/pack.entity';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import { TypeOrmCardRepository } from './typeorm-card.repository';
import { TypeOrmUserCardRepository } from './typeorm-user-card.repository';
import { TypeOrmPackRepository } from './typeorm-pack.repository';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import { IUserCardRepositoryToken } from '../../core/interfaces/user-card-repository.interface';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CardEntity, UserCardEntity, PackEntity]),
  ],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: ICardRepositoryToken,
      useClass: TypeOrmCardRepository,
    },
    {
      provide: IUserCardRepositoryToken,
      useClass: TypeOrmUserCardRepository,
    },
    {
      provide: IPackRepositoryToken,
      useClass: TypeOrmPackRepository,
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


