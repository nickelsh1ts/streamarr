import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './User';

@Entity()
@Unique(['endpoint', 'user'])
export class UserPushSubscription {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('IDX_user_push_subscription_userId')
  @ManyToOne(() => User, (user) => user.pushSubscriptions, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
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
