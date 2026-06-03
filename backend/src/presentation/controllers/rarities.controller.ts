import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { RolesGuard } from '../../use-cases/auth/roles.guard';
import { Roles } from '../../use-cases/auth/roles.decorator';

@Controller('rarities')
@UseGuards(JwtAuthGuard)
export class RaritiesController {
  constructor(
    @InjectRepository(RarityEntity)
    private readonly repository: Repository<RarityEntity>,
  ) {}

  @Get()
  async findAll() {
    const list = await this.repository.find();
    return list.sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const r = await this.repository.findOneBy({ id });
    if (!r) throw new NotFoundException('Rareza no encontrada.');
    return r;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() body: { name: string; color: string; weight: number; priority: number },
  ) {
    const r = this.repository.create({
      name: body.name,
      color: body.color,
      weight: Number(body.weight),
      priority: Number(body.priority),
    });
    return this.repository.save(r);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() body: { name: string; color: string; weight: number; priority: number },
  ) {
    const r = await this.repository.findOneBy({ id });
    if (!r) throw new NotFoundException('Rareza no encontrada.');
    r.name = body.name;
    r.color = body.color;
    r.weight = Number(body.weight);
    r.priority = Number(body.priority);
    return this.repository.save(r);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const r = await this.repository.findOneBy({ id });
    if (!r) throw new NotFoundException('Rareza no encontrada.');
    await this.repository.remove(r);
    return { message: 'Rareza eliminada exitosamente.' };
  }
}
