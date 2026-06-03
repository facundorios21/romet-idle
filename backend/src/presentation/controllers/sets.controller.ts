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
import { SetEntity } from '../../infrastructure/typeorm/entities/set.entity';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { RolesGuard } from '../../use-cases/auth/roles.guard';
import { Roles } from '../../use-cases/auth/roles.decorator';

@Controller('sets')
@UseGuards(JwtAuthGuard)
export class SetsController {
  constructor(
    @InjectRepository(SetEntity)
    private readonly repository: Repository<SetEntity>,
  ) {}

  @Get()
  async findAll() {
    return this.repository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const set = await this.repository.findOneBy({ id });
    if (!set) throw new NotFoundException('Set no encontrado.');
    return set;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: { name: string }) {
    const set = this.repository.create({
      name: body.name,
    });
    return this.repository.save(set);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: { name: string }) {
    const set = await this.repository.findOneBy({ id });
    if (!set) throw new NotFoundException('Set no encontrado.');
    set.name = body.name;
    return this.repository.save(set);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const set = await this.repository.findOneBy({ id });
    if (!set) throw new NotFoundException('Set no encontrado.');
    await this.repository.remove(set);
    return { message: 'Set eliminado exitosamente.' };
  }
}
