import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';
import type { IPackRepository } from '../../core/interfaces/pack-repository.interface';
import { Pack } from '../../core/entities/pack.entity';
import { randomUUID } from 'crypto';

export interface SavePackDto {
  id?: string;
  name: string;
  cost: number;
  cardsCount: number;
  probCommon: number;
  probRare: number;
  probEpic: number;
  probLegendary: number;
  probMythic: number;
}

@Injectable()
export class SavePackUseCase {
  constructor(
    @Inject(IPackRepositoryToken)
    private readonly packRepository: IPackRepository,
  ) {}

  async execute(dto: SavePackDto): Promise<Pack> {
    if (Number(dto.cardsCount) > 10) {
      throw new BadRequestException('El máximo de cartas por sobre es 10.');
    }

    const packId = dto.id && dto.id !== 'new' && dto.id.trim() !== '' ? dto.id.trim() : randomUUID();

    const pack = new Pack(
      packId,
      dto.name,
      Number(dto.cost),
      Number(dto.cardsCount),
      Number(dto.probCommon),
      Number(dto.probRare),
      Number(dto.probEpic),
      Number(dto.probLegendary),
      Number(dto.probMythic),
    );
    return this.packRepository.save(pack);
  }
}
