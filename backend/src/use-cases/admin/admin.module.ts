import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { AdminController } from '../../presentation/controllers/admin.controller';
import { CreateCardUseCase } from './create-card.use-case';
import { SavePackUseCase } from './save-pack.use-case';
import { ElementEntity } from '../../infrastructure/typeorm/entities/element.entity';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';
import { SetEntity } from '../../infrastructure/typeorm/entities/set.entity';

@Module({
  imports: [
    RepositoriesModule,
    TypeOrmModule.forFeature([ElementEntity, RarityEntity, SetEntity]),
  ],
  controllers: [AdminController],
  providers: [CreateCardUseCase, SavePackUseCase],
  exports: [CreateCardUseCase, SavePackUseCase],
})
export class AdminModule {}
