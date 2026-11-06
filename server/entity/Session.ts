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

  @Index()
  @Column({
    type: 'integer',
    nullable: true,
    asExpression: `json_extract("json", '$.userId')`,
    generatedType: 'VIRTUAL',
    // TypeORM still writes generated columns unless told not to
    insert: false,
    update: false,
  })
  public userId?: number | null;

  // connect-typeorm filters on `destroyedAt`; the column keeps its original name
  @DeleteDateColumn({ name: 'deletedAt' })
  public destroyedAt?: Date;
}
