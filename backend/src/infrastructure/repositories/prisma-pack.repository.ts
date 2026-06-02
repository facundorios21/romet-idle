import { Injectable } from '@nestjs/common';
import { IPackRepository } from '../../core/interfaces/pack-repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Pack } from '../../core/entities/pack.entity';
import { PrismaMapper } from './prisma-mapper';

@Injectable()
export class PrismaPackRepository implements IPackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Pack | null> {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
    });
    return pack ? PrismaMapper.toPackDomain(pack) : null;
  }

  async findAll(): Promise<Pack[]> {
    const packs = await this.prisma.pack.findMany({
      orderBy: { cost: 'asc' },
    });
    return packs.map((pack) => PrismaMapper.toPackDomain(pack));
  }

  async save(pack: Pack): Promise<Pack> {
    const upserted = await this.prisma.pack.upsert({
      where: { id: pack.id },
      update: {
        name: pack.name,
        cost: pack.cost,
        cardsCount: pack.cardsCount,
        probCommon: pack.probCommon,
        probRare: pack.probRare,
        probEpic: pack.probEpic,
        probLegendary: pack.probLegendary,
        probMythic: pack.probMythic,
      },
      create: {
        id: pack.id,
        name: pack.name,
        cost: pack.cost,
        cardsCount: pack.cardsCount,
        probCommon: pack.probCommon,
        probRare: pack.probRare,
        probEpic: pack.probEpic,
        probLegendary: pack.probLegendary,
        probMythic: pack.probMythic,
      },
    });
    return PrismaMapper.toPackDomain(upserted);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pack.delete({
      where: { id },
    });
  }
}
