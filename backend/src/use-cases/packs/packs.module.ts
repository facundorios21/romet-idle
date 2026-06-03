import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { PacksController } from '../../presentation/controllers/packs.controller';
import { BuyPackUseCase } from './buy-pack.use-case';
import { ListPacksUseCase } from './list-packs.use-case';
import { AuthModule } from '../auth/auth.module';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';

@Module({
  imports: [
    RepositoriesModule,
    AuthModule,
    TypeOrmModule.forFeature([RarityEntity]),
  ],
  controllers: [PacksController],
  providers: [BuyPackUseCase, ListPacksUseCase],
  exports: [BuyPackUseCase, ListPacksUseCase],
})
export class PacksModule {}

