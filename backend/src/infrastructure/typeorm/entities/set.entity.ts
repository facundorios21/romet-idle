import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sets')
export class SetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
