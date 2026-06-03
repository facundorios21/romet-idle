import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserCardEntity } from './user-card.entity';

@Entity('cards')
export class CardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  rarity: string;

  @Column()
  power: number;

  @Column()
  element: string;

  @Column()
  set: string;

  @OneToMany(() => UserCardEntity, (userCard) => userCard.card)
  owners: UserCardEntity[];
}
