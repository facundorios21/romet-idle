import { UserEntity } from '../typeorm/entities/user.entity';
import { CardEntity } from '../typeorm/entities/card.entity';
import { UserCardEntity } from '../typeorm/entities/user-card.entity';
import { PackEntity } from '../typeorm/entities/pack.entity';
import { User } from '../../core/entities/user.entity';
import { Card } from '../../core/entities/card.entity';
import { UserCard } from '../../core/entities/user-card.entity';
import { Pack } from '../../core/entities/pack.entity';

export class TypeOrmMapper {
  static toUserDomain(entity: UserEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.username,
      entity.password, // map password column to passwordHash property
      entity.coins,
      entity.lastClaim,
      entity.role,
      entity.createdAt,
      entity.updatedAt,
      entity.inventory ? entity.inventory.map(uc => this.toUserCardDomain(uc)) : [],
    );
  }

  static toCardDomain(entity: CardEntity): Card {
    return new Card(
      entity.id,
      entity.name,
      entity.description,
      entity.imageUrl,
      entity.rarity,
      entity.power,
      entity.element,
      entity.set,
    );
  }

  static toUserCardDomain(entity: UserCardEntity): UserCard {
    return new UserCard(
      entity.id,
      entity.userId,
      entity.cardId,
      entity.count,
      entity.level,
      entity.isSpecial,
      entity.card ? this.toCardDomain(entity.card) : undefined,
    );
  }

  static toPackDomain(entity: PackEntity): Pack {
    return new Pack(
      entity.id,
      entity.name,
      entity.cost,
      entity.cardsCount,
      entity.probCommon,
      entity.probRare,
      entity.probEpic,
      entity.probLegendary,
      entity.probMythic,
    );
  }
}
