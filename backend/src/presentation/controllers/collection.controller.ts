import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { GetCollectionUseCase } from '../../use-cases/collection/get-collection.use-case';
import { UpgradeCardUseCase } from '../../use-cases/collection/upgrade-card.use-case';
import { UpgraderUseCase, SacrificedCardDto } from '../../use-cases/collection/upgrader.use-case';
import { ElementEntity } from '../../infrastructure/typeorm/entities/element.entity';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';
import { SetEntity } from '../../infrastructure/typeorm/entities/set.entity';

@Controller('collection')
export class CollectionController {
  constructor(
    private readonly getCollectionUseCase: GetCollectionUseCase,
    private readonly upgradeCardUseCase: UpgradeCardUseCase,
    private readonly upgraderUseCase: UpgraderUseCase,
    @InjectRepository(ElementEntity)
    private readonly elementRepository: Repository<ElementEntity>,
    @InjectRepository(RarityEntity)
    private readonly rarityRepository: Repository<RarityEntity>,
    @InjectRepository(SetEntity)
    private readonly setRepository: Repository<SetEntity>,
  ) {}

  @Get('game-config')
  async getGameConfig() {
    const elements = await this.elementRepository.find();
    const rarities = await this.rarityRepository.find();
    const sets = await this.setRepository.find();
    const sortedRarities = [...rarities].sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
    return {
      elements,
      rarities: sortedRarities,
      sets,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCollection(@Request() req: any) {
    return this.getCollectionUseCase.execute(req.user.id);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeCard(
    @Request() req: any,
    @Body() body: { cardId: string; isSpecial: boolean },
  ) {
    return this.upgradeCardUseCase.execute(req.user.id, body.cardId, body.isSpecial);
  }

  @Post('upgrader')
  @UseGuards(JwtAuthGuard)
  async upgraderBet(
    @Request() req: any,
    @Body() body: { sacrificedCards: SacrificedCardDto[]; targetCardId: string },
  ) {
    return this.upgraderUseCase.execute(req.user.id, body.sacrificedCards, body.targetCardId);
  }
}
