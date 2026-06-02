import { Pack } from '../entities/pack.entity';

export interface IPackRepository {
  findById(id: string): Promise<Pack | null>;
  findAll(): Promise<Pack[]>;
  save(pack: Pack): Promise<Pack>;
  delete(id: string): Promise<void>;
}

export const IPackRepositoryToken = Symbol('IPackRepository');
