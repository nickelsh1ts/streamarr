import type { ISession } from 'connect-typeorm';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Session implements ISession {
  @Index()
  @Column('bigint')
  public expiredAt = Date.now();

  @PrimaryColumn('varchar', { length: 255 })
  public id = '';

  @Column('text')
  public json = '';

  // connect-typeorm filters on `destroyedAt`; the column keeps its original name
  @DeleteDateColumn({ name: 'deletedAt' })
  public destroyedAt?: Date;
}
