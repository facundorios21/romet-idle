import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CardEntity } from './card.entity';

@Entity('user_cards')
@Unique(['userId', 'cardId', 'isSpecial'])
export class UserCardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  cardId: string;

  @Column({ default: 1 })
  count: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: false })
  isSpecial: boolean;

  @ManyToOne(() => UserEntity, (user) => user.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => CardEntity, (card) => card.owners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card: CardEntity;
}
