import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rarities')
export class RarityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  color: string;

  @Column({ type: 'float' })
  weight: number;

  @Column({ type: 'integer', default: 1 })
  priority: number;
}
