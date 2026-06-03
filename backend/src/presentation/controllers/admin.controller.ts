import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
  Put,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { RolesGuard } from '../../use-cases/auth/roles.guard';
import { Roles } from '../../use-cases/auth/roles.decorator';
import { CreateCardUseCase } from '../../use-cases/admin/create-card.use-case';
import { SavePackUseCase } from '../../use-cases/admin/save-pack.use-case';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { Card } from '../../core/entities/card.entity';
import { ElementEntity } from '../../infrastructure/typeorm/entities/element.entity';
import { RarityEntity } from '../../infrastructure/typeorm/entities/rarity.entity';
import { SetEntity } from '../../infrastructure/typeorm/entities/set.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly createCardUseCase: CreateCardUseCase,
    private readonly savePackUseCase: SavePackUseCase,
    @Inject(ICardRepositoryToken)
    private readonly cardRepository: ICardRepository,
    @InjectRepository(ElementEntity)
    private readonly elementRepository: Repository<ElementEntity>,
    @InjectRepository(RarityEntity)
    private readonly rarityRepository: Repository<RarityEntity>,
    @InjectRepository(SetEntity)
    private readonly setRepository: Repository<SetEntity>,
  ) {}

  @Post('cards')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, webp).'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createCard(
    @UploadedFile() file: any,
    @Body() body: {
      id?: string;
      name: string;
      description: string;
      rarity: string;
      power: string;
      element: string;
      set: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('La imagen de la carta es obligatoria.');
    }

    const imageUrl = `/uploads/${file.filename}`;

    return this.createCardUseCase.execute({
      id: body.id,
      name: body.name,
      description: body.description,
      imageUrl,
      rarity: body.rarity,
      power: Number(body.power),
      element: body.element,
      set: body.set,
    });
  }

  @Post('packs')
  async savePack(
    @Body() body: {
      id?: string;
      name: string;
      cost: number;
      cardsCount: number;
      probCommon: number;
      probRare: number;
      probEpic: number;
      probLegendary: number;
      probMythic: number;
    },
  ) {
    // Validar que las probabilidades sumen 100
    const total =
      Number(body.probCommon) +
      Number(body.probRare) +
      Number(body.probEpic) +
      Number(body.probLegendary) +
      Number(body.probMythic);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Las probabilidades de las rarezas deben sumar exactamente 100%.');
    }

    return this.savePackUseCase.execute(body);
  }

  @Put('game-config')
  async saveGameConfig(@Body() body: { elements: any[]; rarities: any[]; sets?: any[] }) {
    // 1. Clear elements and rarities
    await this.elementRepository.delete({});
    await this.rarityRepository.delete({});
    if (body.sets) {
      await this.setRepository.delete({});
    }

    // 2. Insert new elements
    for (const el of body.elements) {
      const element = this.elementRepository.create({
        id: el.id,
        name: el.name,
        color: el.color,
      });
      await this.elementRepository.save(element);
    }

    // 3. Insert new rarities
    for (const r of body.rarities) {
      const rarity = this.rarityRepository.create({
        id: r.id,
        name: r.name,
        color: r.color,
        weight: Number(r.weight),
        priority: Number(r.priority ?? 1),
      });
      await this.rarityRepository.save(rarity);
    }

    // 4. Insert new sets
    if (body.sets) {
      for (const s of body.sets) {
        const set = this.setRepository.create({
          id: s.id,
          name: s.name,
        });
        await this.setRepository.save(set);
      }
    }

    return { message: 'Configuración de elementos, rarezas y sets guardada en la base de datos.' };
  }

  @Put('cards/:id')
  async updateCard(
    @Param('id') id: string,
    @Body() body: {
      name: string;
      description: string;
      rarity: string;
      power: number;
      element: string;
      set: string;
      imageUrl?: string;
    },
  ) {
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new BadRequestException('La carta especificada no existe.');
    }
    const updatedCard = new Card(
      id,
      body.name,
      body.description,
      body.imageUrl || card.imageUrl,
      body.rarity,
      Number(body.power),
      body.element,
      body.set,
    );
    return this.cardRepository.save(updatedCard);
  }

  @Delete('cards/:id')
  async deleteCard(@Param('id') id: string) {
    const success = await this.cardRepository.delete(id);
    if (!success) {
      throw new BadRequestException('La carta especificada no existe o no se pudo eliminar.');
    }
    return { message: 'Carta eliminada exitosamente.' };
  }

  // ---------- Element CRUD ----------
  @Get('elements')
  async getElements() {
    return this.elementRepository.find();
  }

  @Post('elements')
  async createElement(@Body() body: { name: string; color: string }) {
    const element = this.elementRepository.create({ name: body.name, color: body.color });
    return this.elementRepository.save(element);
  }

  @Put('elements/:id')
  async updateElement(@Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    await this.elementRepository.update(id, body);
    return { message: 'Elemento actualizado.' };
  }

  @Delete('elements/:id')
  async deleteElement(@Param('id') id: string) {
    const result = await this.elementRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException('El elemento especificado no existe o no se pudo eliminar.');
    }
    return { message: 'Elemento eliminado.' };
  }

  // ---------- Rarity CRUD ----------
  @Get('rarities')
  async getRarities() {
    return this.rarityRepository.find();
  }

  @Post('rarities')
  async createRarity(@Body() body: { name: string; color: string; weight: number; priority: number }) {
    const rarity = this.rarityRepository.create({
      name: body.name,
      color: body.color,
      weight: body.weight,
      priority: body.priority,
    });
    return this.rarityRepository.save(rarity);
  }

  @Put('rarities/:id')
  async updateRarity(@Param('id') id: string, @Body() body: { name?: string; color?: string; weight?: number; priority?: number }) {
    await this.rarityRepository.update(id, body);
    return { message: 'Rareza actualizada.' };
  }

  @Delete('rarities/:id')
  async deleteRarity(@Param('id') id: string) {
    const result = await this.rarityRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException('La rareza especificada no existe o no se pudo eliminar.');
    }
    return { message: 'Rareza eliminada.' };
  }

  // ---------- Set CRUD ----------
  @Get('sets')
  async getSets() {
    return this.setRepository.find();
  }

  @Post('sets')
  async createSet(@Body() body: { name: string }) {
    const set = this.setRepository.create({ name: body.name });
    return this.setRepository.save(set);
  }

  @Put('sets/:id')
  async updateSet(@Param('id') id: string, @Body() body: { name?: string }) {
    await this.setRepository.update(id, body);
    return { message: 'Set actualizado.' };
  }

  @Delete('sets/:id')
  async deleteSet(@Param('id') id: string) {
    const result = await this.setRepository.delete(id);
    if (result.affected === 0) {
      throw new BadRequestException('El set especificado no existe o no se pudo eliminar.');
    }
    return { message: 'Set eliminado.' };
  }
}
