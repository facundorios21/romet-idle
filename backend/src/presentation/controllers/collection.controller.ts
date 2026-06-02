import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { GetCollectionUseCase } from '../../use-cases/collection/get-collection.use-case';

@Controller('collection')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(private readonly getCollectionUseCase: GetCollectionUseCase) {}

  @Get()
  async getCollection(@Request() req: any) {
    return this.getCollectionUseCase.execute(req.user.id);
  }
}
