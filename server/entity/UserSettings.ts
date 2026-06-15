import type { NotificationAgentTypes } from '@server/interfaces/api/userSettingsInterfaces';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
} from '@server/lib/notifications';
import { NotificationAgentKey } from '@server/lib/settings';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import type { NotificationType } from '@server/constants/notification';

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
  public discordId?: string;

  @Column({ type: 'text', nullable: true })
  public pushbulletAccessToken?: string;

  @Column({ type: 'text', nullable: true })
  public pushoverApplicationToken?: string;

  @Column({ type: 'text', nullable: true })
  public pushoverUserKey?: string;

  @Column({ type: 'text', nullable: true })
  public pushoverSound?: string;

  @Column({ type: 'text', nullable: true })
  public telegramChatId?: string;

  @Column({ type: 'text', nullable: true })
  public telegramMessageThreadId?: string;

  @Column({ type: 'boolean', default: false })
  public telegramSendSilently?: boolean;

  @Column({ type: 'text', nullable: true })
  public sharedLibraries?: string;

  @Column({ type: 'boolean', default: false })
  public allowDownloads: boolean;

  @Column({ type: 'boolean', default: false })
  public allowLiveTv: boolean;

  @Column({ type: 'boolean', default: false })
  public allowPlexHome: boolean;

  @Column({ type: 'datetime', nullable: true })
  public trialPeriodEndsAt?: Date;

  @Column({ type: 'text', nullable: true })
  public trialPeriodOutcome?: 'promote' | 'deactivate' | null;

  @Column({ type: 'boolean', default: false })
  public trialExtensionRequested: boolean;

  @Column({ type: 'datetime', nullable: true })
  public trialExtensionRequestedAt?: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      // Stored as a JSON array of newsletter IDs the user has opted out of.
      // Missing/empty means subscribed to all newsletters (opt-out model).
      from: (value: string | null): number[] => {
        if (!value) {
          return [];
        }

        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed)
            ? parsed.filter((id): id is number => typeof id === 'number')
            : [];
        } catch {
          return [];
        }
      },
      to: (value: number[] | null | undefined): string | null => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return null;
        }

        return JSON.stringify([...new Set(value)]);
      },
    },
  })
  public unsubscribedNewsletters: number[];

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
    return hasNotificationType(
      type,
      this.notificationTypes[key] ?? ALL_NOTIFICATIONS
    );
  }
}
