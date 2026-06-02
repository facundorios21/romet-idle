import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { UsersController } from '../../presentation/controllers/users.controller';
import { GetProfileUseCase } from './get-profile.use-case';
import { ClaimCoinsUseCase } from './claim-coins.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RepositoriesModule, AuthModule],
  controllers: [UsersController],
  providers: [GetProfileUseCase, ClaimCoinsUseCase],
  exports: [GetProfileUseCase, ClaimCoinsUseCase],
})
export class UsersModule {}
