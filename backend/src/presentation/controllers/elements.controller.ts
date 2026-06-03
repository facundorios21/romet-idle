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
import { ElementEntity } from '../../infrastructure/typeorm/entities/element.entity';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { RolesGuard } from '../../use-cases/auth/roles.guard';
import { Roles } from '../../use-cases/auth/roles.decorator';

@Controller('elements')
@UseGuards(JwtAuthGuard)
export class ElementsController {
  constructor(
    @InjectRepository(ElementEntity)
    private readonly repository: Repository<ElementEntity>,
  ) {}

  @Get()
  async findAll() {
    return this.repository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const el = await this.repository.findOneBy({ id });
    if (!el) throw new NotFoundException('Elemento no encontrado.');
    return el;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: { name: string; color: string }) {
    const el = this.repository.create({
      name: body.name,
      color: body.color,
    });
    return this.repository.save(el);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: { name: string; color: string }) {
    const el = await this.repository.findOneBy({ id });
    if (!el) throw new NotFoundException('Elemento no encontrado.');
    el.name = body.name;
    el.color = body.color;
    return this.repository.save(el);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const el = await this.repository.findOneBy({ id });
    if (!el) throw new NotFoundException('Elemento no encontrado.');
    await this.repository.remove(el);
    return { message: 'Elemento eliminado exitosamente.' };
  }
}
