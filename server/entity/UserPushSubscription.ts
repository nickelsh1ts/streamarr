import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class UserPushSubscription {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public user: User;

  @Column('text')
  public endpoint: string;

  @Column('text')
  public p256dh: string;

  @Column('text')
  public auth: string;

  @Column({ type: 'text', nullable: true })
  public userAgent: string;

  @CreateDateColumn({ nullable: true })
  public createdAt: Date;

  constructor(init?: Partial<UserPushSubscription>) {
    Object.assign(this, init);
  }
}
