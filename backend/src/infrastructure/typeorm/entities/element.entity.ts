import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('elements')
export class ElementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  color: string;
}
