import type { NotificationType } from '@server/constants/notification';
import { NotificationSeverity } from '@server/constants/notification';
import { User } from '@server/entity/User';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public type: NotificationType;

  @Column({ type: 'text', default: NotificationSeverity.INFO })
  public severity: NotificationSeverity;

  @Column({ type: 'text' })
  public subject: string;

  @Column({ type: 'text', nullable: true })
  public message: string;

  @Column({ type: 'boolean', default: false })
  public isRead: boolean;

  @Column({ type: 'text', nullable: true })
  public actionUrl?: string;

  @Column({ type: 'text', nullable: true })
  public actionUrlTitle?: string;

  @Index('IDX_notification_notifyUserId')
  @ManyToOne(() => User, (user) => user.notifications, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notifyUserId' })
  public notifyUser: User;

  @Index('IDX_notification_createdById')
  @ManyToOne(() => User, (user) => user.createdNotifications, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdById' })
  public createdBy: User;

  @Index('IDX_notification_updatedById')
  @ManyToOne(() => User, (user) => user.modifiedNotifications, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'updatedById' })
  public updatedBy: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Notification>) {
    Object.assign(this, init);
  }
}

export default Notification;
