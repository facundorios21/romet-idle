import { Injectable, Inject } from '@nestjs/common';
import { ICardRepositoryToken } from '../../core/interfaces/card-repository.interface';
import type { ICardRepository } from '../../core/interfaces/card-repository.interface';
import { Card } from '../../core/entities/card.entity';
import { randomUUID } from 'crypto';

export interface CreateCardDto {
  id?: string;
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
    const cardId = dto.id || randomUUID();
    const card = new Card(
      cardId,
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
