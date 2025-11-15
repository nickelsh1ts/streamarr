import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import PreparedEmail from '@server/lib/email';
import type { PermissionCheckOptions } from '@server/lib/permissions';
import { Permission } from '@server/lib/permissions';
import { hasPermission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import path from 'path';
import { default as generatePassword } from 'secure-random-password';
import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  Not,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';
import { UserPushSubscription } from './UserPushSubscription';
import { UserSettings } from './UserSettings';
import Invite from '@server/entity/Invite';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import { AfterDate } from '@server/utils/dateHelpers';
import { InviteStatus } from '@server/constants/invite';
import Event from '@server/entity/Event';
import { Notification } from '@server/entity/Notification';

@Entity()
export class User {
  public static filterMany(
    users: User[],
    showFiltered?: boolean
  ): Partial<User>[] {
    return users.map((u) => u.filter(showFiltered));
  }

  static readonly filteredFields: string[] = ['email', 'plexId'];

  public displayName: string;

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    unique: true,
    transformer: {
      from: (value: string): string => (value ?? '').toLowerCase(),
      to: (value: string): string => (value ?? '').toLowerCase(),
    },
  })
  public email: string;

  @Column({ nullable: true })
  public plexUsername?: string;

  @Column({ nullable: true })
  public username?: string;

  @Column({ nullable: true, select: false })
  public password?: string;

  @Column({ nullable: true, select: false })
  public resetPasswordGuid?: string;

  @Column({ type: 'date', nullable: true })
  public recoveryLinkExpirationDate?: Date | null;

  @Column({ type: 'integer', default: UserType.PLEX })
  public userType: UserType;

  @Column({ nullable: true, select: true })
  public plexId?: number;

  @Column({ nullable: true, select: false })
  public plexToken?: string;

  @Column({ type: 'integer', default: 32 })
  public permissions = 32;

  @Column()
  public avatar: string;

  @VirtualColumn({
    query: (alias) =>
      `SELECT COUNT(*) FROM "invite" WHERE "invite"."createdById" = ${alias}.id`,
  })
  public inviteCount: number;

  @Column({ nullable: true })
  public inviteQuotaLimit?: number;

  @OneToMany(() => Invite, (invite) => invite.createdBy)
  public createdInvites: Invite[];

  @ManyToOne(() => Invite, (invite) => invite.redeemedBy, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  public redeemedInvite: Invite;

  @OneToMany(() => Invite, (invite) => invite.updatedBy)
  public modifiedInvites: Invite[];

  @Column({ nullable: true })
  public inviteQuotaDays?: number;

  @OneToMany(() => Event, (event) => event.createdBy)
  public createdEvents: Event[];

  @OneToMany(() => Event, (event) => event.updatedBy)
  public modifiedEvents: Event[];

  @OneToMany(() => Notification, (notification) => notification.createdBy)
  public createdNotifications: Notification[];

  @OneToMany(() => Notification, (notification) => notification.updatedBy)
  public modifiedNotifications: Notification[];

  @OneToOne(() => UserSettings, (settings) => settings.user, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
  })
  public settings?: UserSettings;

  @OneToMany(() => UserPushSubscription, (pushSub) => pushSub.user)
  public pushSubscriptions: UserPushSubscription[];

  @OneToMany(() => Notification, (notification) => notification.notifyUser)
  public notifications: Notification[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }

  public filter(showFiltered?: boolean): Partial<User> {
    const filtered: Partial<User> = Object.assign(
      {},
      ...(Object.keys(this) as (keyof User)[])
        .filter((k) => showFiltered || !User.filteredFields.includes(k))
        .map((k) => ({ [k]: this[k] }))
    );

    return filtered;
  }

  public hasPermission(
    permissions: Permission | Permission[],
    options?: PermissionCheckOptions
  ): boolean {
    return !!hasPermission(permissions, this.permissions, options);
  }

  public passwordMatch(password: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.password) {
        resolve(bcrypt.compare(password, this.password));
      } else {
        return resolve(false);
      }
    });
  }

  public async setPassword(password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    this.password = hashedPassword;
  }

  public async generatePassword(): Promise<string> {
    const password = generatePassword.randomPassword({ length: 16 });
    await this.setPassword(password);
    return password;
  }

  public async resetPassword(): Promise<void> {
    const guid = randomUUID();
    this.resetPasswordGuid = guid;

    // 24 hours into the future
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    this.recoveryLinkExpirationDate = targetDate;

    const { applicationTitle, applicationUrl } = getSettings().main;
    const resetPasswordLink = `${applicationUrl}/resetpassword/${guid}`;

    try {
      logger.info(`Sending reset password email for ${this.email}`, {
        label: 'User Management',
      });
      const email = new PreparedEmail(getSettings().notifications.agents.email);
      const { customLogo } = getSettings().main;
      const logoUrl = customLogo || '/logo_full.png';

      await email.send({
        template: path.join(__dirname, '../templates/email/resetpassword'),
        message: { to: this.email },
        locals: {
          resetPasswordLink,
          applicationUrl,
          applicationTitle,
          recipientName: this.displayName,
          recipientEmail: this.email,
          logoUrl,
        },
      });
    } catch (e) {
      logger.error('Failed to send out reset password email', {
        label: 'User Management',
        message: e.message,
      });
    }
  }

  @AfterLoad()
  public setDisplayName(): void {
    this.displayName = this.username || this.plexUsername || this.email;
  }

  public isInTrialPeriod(): boolean {
    // Check if user.settings.trialPeriodEndsAt exists and is in the future
    if (
      !this.settings?.trialPeriodEndsAt ||
      !getSettings().main.enableTrialPeriod ||
      this.hasPermission([Permission.MANAGE_USERS, Permission.MANAGE_INVITES], {
        type: 'or',
      })
    ) {
      return false;
    }
    return new Date(this.settings.trialPeriodEndsAt) > new Date();
  }

  public async getQuota(): Promise<QuotaResponse> {
    const {
      main: { defaultQuotas },
    } = getSettings();
    const inviteRepository = getRepository(Invite);
    const canBypass = this.hasPermission(
      [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
      {
        type: 'or',
      }
    );

    const inviteQuotaLimit = !canBypass
      ? (this.inviteQuotaLimit ?? defaultQuotas.invites.quotaLimit)
      : -1;
    const inviteQuotaDays =
      this.inviteQuotaDays ?? defaultQuotas.invites.quotaDays;

    const inTrialPeriod = this.isInTrialPeriod();
    const trialPeriodEndsAt = this.settings?.trialPeriodEndsAt ?? null;

    // Count invite invites made during quota period
    let inviteQuotaUsed: number;
    if (inviteQuotaLimit) {
      if (inviteQuotaDays === 0) {
        // Lifetime: count all invites ever made by this user
        inviteQuotaUsed = await inviteRepository.count({
          where: {
            createdBy: { id: this.id },
            status: Not(InviteStatus.EXPIRED),
          },
        });
      } else {
        const inviteDate = new Date();
        inviteDate.setDate(inviteDate.getDate() - inviteQuotaDays);
        inviteQuotaUsed = await inviteRepository.count({
          where: {
            createdBy: { id: this.id },
            createdAt: AfterDate(inviteDate),
            status: Not(InviteStatus.EXPIRED),
          },
        });
      }
    } else {
      inviteQuotaUsed = 0;
    }

    const quotaExceeded =
      inviteQuotaLimit &&
      inviteQuotaLimit !== -1 &&
      inviteQuotaLimit - inviteQuotaUsed <= 0;

    return {
      invite: {
        days: inviteQuotaDays,
        limit: inviteQuotaLimit,
        used: inviteQuotaUsed,
        remaining: inviteQuotaLimit
          ? Math.max(0, inviteQuotaLimit - inviteQuotaUsed)
          : null,
        restricted:
          (inTrialPeriod && !canBypass) || quotaExceeded ? true : false,
        trialPeriodActive: inTrialPeriod,
        trialPeriodEndsAt: trialPeriodEndsAt,
        trialPeriodEnabled: getSettings().main.enableTrialPeriod,
      },
    };
  }
}
