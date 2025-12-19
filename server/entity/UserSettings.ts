import type { NotificationAgentTypes } from '@server/interfaces/api/userSettingsInterfaces';
import { hasNotificationType } from '@server/lib/notifications';
import { NotificationAgentKey } from '@server/lib/settings';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { NotificationType } from '@server/constants/notification';

export const ALL_NOTIFICATIONS = Object.values(NotificationType)
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

  @Column({ type: 'text', default: '' })
  public locale?: string;

  @Column({ type: 'text', nullable: true })
  public region?: string;

  @Column({ type: 'text', nullable: true })
  public originalLanguage?: string;

  @Column({ type: 'text', nullable: true })
  public pgpKey?: string;

  @Column({ type: 'text', nullable: true })
  public sharedLibraries?: string;

  @Column({ type: 'boolean', default: false })
  public allowDownloads: boolean;

  @Column({ type: 'boolean', default: false })
  public allowLiveTv: boolean;

  @Column({ type: 'datetime', nullable: true })
  public trialPeriodEndsAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      from: (value: string | null): Partial<NotificationAgentTypes> => {
        // Return empty object if no value exists
        // Missing agents will be treated as "all enabled" by hasNotificationType
        if (!value) {
          return {};
        }

        try {
          const values = JSON.parse(value) as Partial<NotificationAgentTypes>;

          // Return the values as-is, without adding defaults
          // This allows us to distinguish between:
          // 1. undefined = never set, treat as all enabled
          // 2. 0 or other value = explicitly set by user
          return values;
        } catch {
          // If parsing fails, return empty object
          return {};
        }
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

        // Only save if there are any valid keys remaining
        const hasValidKeys = Object.keys(value).length > 0;
        if (!hasValidKeys) {
          return null;
        }

        return JSON.stringify(value);
      },
    },
  })
  public notificationTypes: Partial<NotificationAgentTypes>;

  public hasNotificationType(
    key: NotificationAgentKey,
    type: NotificationType
  ): boolean {
    return hasNotificationType(type, this.notificationTypes[key] ?? 0);
  }
}
