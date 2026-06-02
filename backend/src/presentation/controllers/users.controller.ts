import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { GetProfileUseCase } from '../../use-cases/users/get-profile.use-case';
import { ClaimCoinsUseCase } from '../../use-cases/users/claim-coins.use-case';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly claimCoinsUseCase: ClaimCoinsUseCase,
  ) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.getProfileUseCase.execute(req.user.id);
  }

  @Post('claim-idle')
  async claimIdle(@Request() req: any, @Body('clicks') clicks?: number) {
    return this.claimCoinsUseCase.execute(req.user.id, clicks || 0);
  }
}
