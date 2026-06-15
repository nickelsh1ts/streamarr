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

export type NewsletterBodyFormat = 'markdown' | 'html';
export type NewsletterRecipientMode = 'all' | 'custom';
export type NewsletterScheduleType = 'once' | 'recurring';

export interface RecentlyAddedTypeConfig {
  enabled: boolean;
  days?: number;
  count?: number;
  libraries?: string[];
  /** Optional admin-supplied section heading; falls back to a localized default. */
  header?: string;
}

export interface NewsletterBlockConfig {
  recentlyAdded?: Partial<Record<string, RecentlyAddedTypeConfig>>;
  topStreams?: Partial<Record<string, RecentlyAddedTypeConfig>>;
  byTag?: {
    header?: string;
    count?: number;
    // Plex labels are applied per library, so they carry a library selection.
    plex?: {
      enabled: boolean;
      label?: string;
      libraries?: string[];
    };
    // Radarr/Sonarr tags are instance-wide, not library-scoped.
    servarr?: {
      enabled: boolean;
      radarrTag?: string;
      sonarrTag?: string;
    };
  };
}

const jsonColumnTransformer = <T>(fallback: T) => ({
  from: (value: string | null): T => {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  },
  to: (value: T): string | null => {
    if (value == null) {
      return null;
    }

    return JSON.stringify(value);
  },
});

@Entity()
export class Newsletter {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text' })
  public name: string;

  @Column({ type: 'text' })
  public subject: string;

  @Column({ type: 'text', nullable: true })
  public description?: string | null;

  @Column({ type: 'text', default: '' })
  public body: string;

  @Column({ type: 'text', default: 'markdown' })
  public bodyFormat: NewsletterBodyFormat;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonColumnTransformer<NewsletterBlockConfig>({}),
  })
  public blocks: NewsletterBlockConfig;

  @Column({ type: 'text', default: 'all' })
  public recipientMode: NewsletterRecipientMode;

  @Column({
    type: 'text',
    nullable: true,
    transformer: jsonColumnTransformer<number[]>([]),
  })
  public recipientIds: number[];

  @Column({ type: 'boolean', default: false })
  public isImportant: boolean;

  @Column({ type: 'boolean', default: false })
  public enabled: boolean;

  @Column({ type: 'text', default: 'recurring' })
  public scheduleType: NewsletterScheduleType;

  @Column({ type: 'text', nullable: true })
  public cronSchedule?: string | null;

  @Column({ type: 'datetime', nullable: true })
  public sendAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  public lastSentAt?: Date | null;

  @Index('IDX_newsletter_createdById')
  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdById' })
  public createdBy: User;

  @Index('IDX_newsletter_updatedById')
  @ManyToOne(() => User, {
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

  constructor(init?: Partial<Newsletter>) {
    Object.assign(this, init);
  }
}

export default Newsletter;
