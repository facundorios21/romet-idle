import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('packs')
export class PackEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'float' })
  cost: number;

  @Column()
  cardsCount: number;

  @Column({ type: 'float' })
  probCommon: number;

  @Column({ type: 'float' })
  probRare: number;

  @Column({ type: 'float' })
  probEpic: number;

  @Column({ type: 'float' })
  probLegendary: number;

  @Column({ type: 'float' })
  probMythic: number;
}
