import { Injectable, Inject } from '@nestjs/common';
import { IPackRepositoryToken } from '../../core/interfaces/pack-repository.interface';
import type { IPackRepository } from '../../core/interfaces/pack-repository.interface';

@Injectable()
export class ListPacksUseCase {
  constructor(
    @Inject(IPackRepositoryToken)
    private readonly packRepository: IPackRepository,
  ) {}

  async execute() {
    return this.packRepository.findAll();
  }
}
