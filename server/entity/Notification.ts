import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { NotificationBody } from '@server/interfaces/api/notificationInterfaces';
import { Permission } from '@server/lib/permissions';
import type { NotificationType } from '@server/constants/notification';
import { NotificationSeverity } from '@server/constants/notification';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Notification {
  public static async notification(
    user: User,
    notificationBody: NotificationBody
  ): Promise<Notification> {
    const notificationRepository = getRepository(Notification);
    const userRepository = getRepository(User);

    let notificationUser = user;

    if (
      notificationBody.userId &&
      !notificationUser.hasPermission([
        Permission.MANAGE_USERS,
        Permission.MANAGE_NOTIFICATIONS,
      ])
    ) {
      throw new Error(
        'You do not have permission to modify the notification user.'
      );
    } else if (notificationBody.userId) {
      notificationUser = await userRepository.findOneOrFail({
        where: { id: notificationBody.userId },
      });
    }

    if (!notificationUser) {
      throw new Error('User missing from notification context.');
    }

    const notification = new Notification({
      createdBy: notificationUser,
      updatedBy: notificationUser,
      notifyUser: notificationBody.notifyUser,
      type: notificationBody.type,
      isRead: false,
      severity: notificationBody.severity,
      subject: notificationBody.subject,
      message: notificationBody.message,
      actionUrl: notificationBody.actionUrl,
      actionUrlTitle: notificationBody.actionUrlTitle,
    });
    await notificationRepository.save(notification);
    return notification;
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer' })
  public type: NotificationType;

  @Column({ default: NotificationSeverity.INFO })
  public severity: NotificationSeverity;

  @Column({ type: 'text' })
  public subject: string;

  @Column({ type: 'text' })
  public message: string;

  @Column({ type: 'boolean', default: false })
  public isRead: boolean;

  @Column({ type: 'text', nullable: true })
  public actionUrl?: string;

  @Column({ type: 'text', nullable: true })
  public actionUrlTitle?: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public notifyUser: User;

  @ManyToOne(() => User, (user) => user.createdNotifications, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  public createdBy: User;

  @ManyToOne(() => User, (user) => user.modifiedNotifications, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
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
