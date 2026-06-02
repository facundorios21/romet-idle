import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { AdminController } from '../../presentation/controllers/admin.controller';
import { CreateCardUseCase } from './create-card.use-case';
import { SavePackUseCase } from './save-pack.use-case';

@Module({
  imports: [RepositoriesModule],
  controllers: [AdminController],
  providers: [CreateCardUseCase, SavePackUseCase],
  exports: [CreateCardUseCase, SavePackUseCase],
})
export class AdminModule {}
