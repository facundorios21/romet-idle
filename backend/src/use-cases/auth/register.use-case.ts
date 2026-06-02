import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { IUserRepositoryToken } from '../../core/interfaces/user-repository.interface';
import type { IUserRepository } from '../../core/interfaces/user-repository.interface';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../../presentation/dtos/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(IUserRepositoryToken)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.userRepository.create(dto.username, dto.email, passwordHash);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      role: user.role,
      lastClaim: user.lastClaim,
    };

  }
}
