import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { CollectionController } from '../../presentation/controllers/collection.controller';
import { ElementsController } from '../../presentation/controllers/elements.controller';
import { RaritiesController } from '../../presentation/controllers/rarities.controller';
import { SetsController } from '../../presentation/controllers/sets.controller';
import { GetCollectionUseCase } from './get-collection.use-case';
import { UpgradeCardUseCase } from './upgrade-card.use-case';
import { UpgraderUseCase } from './upgrader.use-case';
import { AuthModule } from '../auth/auth.module';
import { ElementEntity } from '../../infrastructure/typeorm/entities/element.entity';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';
import { SetEntity } from '../../infrastructure/typeorm/entities/set.entity';

@Module({
  imports: [
    RepositoriesModule,
    AuthModule,
    TypeOrmModule.forFeature([ElementEntity, RarityEntity, SetEntity]),
  ],
  controllers: [CollectionController, ElementsController, RaritiesController, SetsController],
  providers: [GetCollectionUseCase, UpgradeCardUseCase, UpgraderUseCase],
  exports: [GetCollectionUseCase, UpgradeCardUseCase, UpgraderUseCase],
})
export class CollectionModule {}
