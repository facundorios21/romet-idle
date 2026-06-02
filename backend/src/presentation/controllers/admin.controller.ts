import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../use-cases/auth/jwt-auth.guard';
import { RolesGuard } from '../../use-cases/auth/roles.guard';
import { Roles } from '../../use-cases/auth/roles.decorator';
import { CreateCardUseCase } from '../../use-cases/admin/create-card.use-case';
import { SavePackUseCase } from '../../use-cases/admin/save-pack.use-case';
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
      id: string;
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
      id: string;
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
}
