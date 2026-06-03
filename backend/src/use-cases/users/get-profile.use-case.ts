import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      role: user.role,
      lastClaim: user.lastClaim,
      createdAt: user.createdAt,
    };

  }
}
