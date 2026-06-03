import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPackRepository } from '../../core/interfaces/pack-repository.interface';
import { PackEntity } from '../typeorm/entities/pack.entity';
import { Pack } from '../../core/entities/pack.entity';
import { TypeOrmMapper } from './typeorm-mapper';

@Injectable()
export class TypeOrmPackRepository implements IPackRepository {
  constructor(
    @InjectRepository(PackEntity)
    private readonly repository: Repository<PackEntity>,
  ) {}

  async findById(id: string): Promise<Pack | null> {
    const pack = await this.repository.findOne({
      where: { id },
    });
    return pack ? TypeOrmMapper.toPackDomain(pack) : null;
  }

  async findAll(): Promise<Pack[]> {
    const packs = await this.repository.find({
      order: { cost: 'ASC' },
    });
    return packs.map((pack) => TypeOrmMapper.toPackDomain(pack));
  }

  async save(pack: Pack): Promise<Pack> {
    const packEntity = this.repository.create({
      id: pack.id,
      name: pack.name,
      cost: pack.cost,
      cardsCount: pack.cardsCount,
      probCommon: pack.probCommon,
      probRare: pack.probRare,
      probEpic: pack.probEpic,
      probLegendary: pack.probLegendary,
      probMythic: pack.probMythic,
    });
    const saved = await this.repository.save(packEntity);
    return TypeOrmMapper.toPackDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
