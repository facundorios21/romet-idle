import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { PacksController } from '../../presentation/controllers/packs.controller';
import { BuyPackUseCase } from './buy-pack.use-case';
import { ListPacksUseCase } from './list-packs.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RepositoriesModule, AuthModule],
  controllers: [PacksController],
  providers: [BuyPackUseCase, ListPacksUseCase],
  exports: [BuyPackUseCase, ListPacksUseCase],
})
export class PacksModule {}

