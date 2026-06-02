import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { GetCollectionUseCase } from '../../use-cases/collection/get-collection.use-case';
import { UpgradeCardUseCase } from '../../use-cases/collection/upgrade-card.use-case';

@Controller('collection')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(
    private readonly getCollectionUseCase: GetCollectionUseCase,
    private readonly upgradeCardUseCase: UpgradeCardUseCase,
  ) {}

  @Get()
  async getCollection(@Request() req: any) {
    return this.getCollectionUseCase.execute(req.user.id);
  }

  @Post('upgrade')
  async upgradeCard(
    @Request() req: any,
    @Body() body: { cardId: string; isSpecial: boolean },
  ) {
    return this.upgradeCardUseCase.execute(req.user.id, body.cardId, body.isSpecial);
  }
}
