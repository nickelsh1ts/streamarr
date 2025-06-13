import type { NotificationAgentTypes } from '@server/interfaces/api/userSettingsInterfaces';
import { hasNotificationType, Notification } from '@server/lib/notifications';
import { NotificationAgentKey } from '@server/lib/settings';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

export const ALL_NOTIFICATIONS = Object.values(Notification)
  .filter((v) => !isNaN(Number(v)))
  .reduce((a, v) => a + Number(v), 0);

@Entity()
export class UserSettings {
  constructor(init?: Partial<UserSettings>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @Column({ default: '' })
  public locale?: string;

  @Column({ nullable: true })
  public region?: string;

  @Column({ nullable: true })
  public originalLanguage?: string;

  @Column({ nullable: true })
  public pgpKey?: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      from: (value: string | null): Partial<NotificationAgentTypes> => {
        const defaultTypes = {
          email: ALL_NOTIFICATIONS,
          webpush: ALL_NOTIFICATIONS,
        };
        if (!value) {
          return defaultTypes;
        }

        const values = JSON.parse(value) as Partial<NotificationAgentTypes>;

        // Something with the migration to this field has caused some issue where
        // the value pre-populates with just a raw "2"? Here we check if that's the case
        // and return the default notification types if so
        if (typeof values !== 'object') {
          return defaultTypes;
        }

        if (values.email == null) {
          values.email = ALL_NOTIFICATIONS;
        }

        if (values.webpush == null) {
          values.webpush = ALL_NOTIFICATIONS;
        }

        return values;
      },
      to: (value: Partial<NotificationAgentTypes>): string | null => {
        if (!value || typeof value !== 'object') {
          return null;
        }

        const allowedKeys = Object.values(NotificationAgentKey);

        // Remove any unknown notification agent keys before saving to db
        (Object.keys(value) as (keyof NotificationAgentTypes)[]).forEach(
          (key) => {
            if (!allowedKeys.includes(key)) {
              delete value[key];
            }
          }
        );

        return JSON.stringify(value);
      },
    },
  })
  public notificationTypes: Partial<NotificationAgentTypes>;

  public hasNotificationType(
    key: NotificationAgentKey,
    type: Notification
  ): boolean {
    return hasNotificationType(type, this.notificationTypes[key] ?? 0);
  }
}
