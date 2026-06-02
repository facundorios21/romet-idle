import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';

@Injectable()
export class ClaimCoinsUseCase {
  // Genera aproximadamente 10 monedas por minuto (0.166 monedas por segundo)
  private readonly COINS_PER_SECOND = 0.166667;

  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number, clicks = 0) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const now = new Date();
    const diffMs = now.getTime() - user.lastClaim.getTime();
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

    const earnedCoins = Math.round(diffSeconds * this.COINS_PER_SECOND * 100) / 100;
    const clickCoins = clicks * 5; // 5 monedas por click
    const totalEarned = earnedCoins + clickCoins;

    let updatedUser = user;
    if (totalEarned > 0) {
      await this.userRepository.addCoins(userId, totalEarned);
      updatedUser = await this.userRepository.updateLastClaim(userId, now);
    } else {
      updatedUser = await this.userRepository.updateLastClaim(userId, now);
    }

    return {
      earnedCoins,
      clickCoins,
      totalEarned,
      totalCoins: updatedUser.coins,
      lastClaim: updatedUser.lastClaim,
    };
  }
}
