import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { BuyPackUseCase } from '../../use-cases/packs/buy-pack.use-case';
import { ListPacksUseCase } from '../../use-cases/packs/list-packs.use-case';

@Controller('packs')
@UseGuards(JwtAuthGuard)
export class PacksController {
  constructor(
    private readonly buyPackUseCase: BuyPackUseCase,
    private readonly listPacksUseCase: ListPacksUseCase,
  ) {}

  @Get()
  async getPacks() {
    return this.listPacksUseCase.execute();
  }

  @Post('buy')
  async buyPack(@Request() req: any, @Body('packType') packType: string) {
    return this.buyPackUseCase.execute(req.user.id, packType);
  }
}

