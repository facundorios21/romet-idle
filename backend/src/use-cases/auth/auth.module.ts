import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { RegisterUseCase } from './register.use-case';
import { LoginUseCase } from './login.use-case';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from '../../presentation/controllers/auth.controller';

@Module({
  imports: [
    RepositoriesModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_aetheria_2026_change_me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION as any) || '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [RegisterUseCase, LoginUseCase, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
