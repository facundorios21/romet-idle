import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { CollectionController } from '../../presentation/controllers/collection.controller';
import { GetCollectionUseCase } from './get-collection.use-case';
import { UpgradeCardUseCase } from './upgrade-card.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RepositoriesModule, AuthModule],
  controllers: [CollectionController],
  providers: [GetCollectionUseCase, UpgradeCardUseCase],
  exports: [GetCollectionUseCase, UpgradeCardUseCase],
})
export class CollectionModule {}
