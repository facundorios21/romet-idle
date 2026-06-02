import { Injectable, Inject } from '@nestjs/common';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { Card } from '../../core/entities/card.entity';

export interface CreateCardDto {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  power: number;
  element: string;
  set: string;
}

@Injectable()
export class CreateCardUseCase {
  constructor(
    @Inject(ICardRepositoryToken)
    private readonly cardRepository: ICardRepository,
  ) {}

  async execute(dto: CreateCardDto): Promise<Card> {
    const card = new Card(
      dto.id,
      dto.name,
      dto.description,
      dto.imageUrl,
      dto.rarity.toUpperCase(),
      Number(dto.power),
      dto.element.toUpperCase(),
      dto.set,
    );
    return this.cardRepository.save(card);
  }
}
