import { UserType } from '@server/constants/user';
import PreparedEmail from '@server/lib/email';
import type { PermissionCheckOptions } from '@server/lib/permissions';
import type { Permission } from '@server/lib/permissions';
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
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserPushSubscription } from './UserPushSubscription';
import { UserSettings } from './UserSettings';
import Invite from '@server/entity/Invite';

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

  @Column({ type: 'integer', default: 0 })
  public permissions = 0;

  @Column()
  public avatar: string;

  @Column({ nullable: true })
  public inviteQuotaLimit?: number;

  @OneToMany(() => Invite, (invite) => invite.createdBy)
  public createdInvites: Invite[];

  @ManyToOne(() => Invite, (invite) => invite.redeemedBy)
  public redeemedInvite: Invite;

  @OneToMany(() => Invite, (invite) => invite.updatedBy)
  public modifiedInvites: Invite[];

  @OneToOne(() => UserSettings, (settings) => settings.user, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
  })
  public settings?: UserSettings;

  @OneToMany(() => UserPushSubscription, (pushSub) => pushSub.user)
  public pushSubscriptions: UserPushSubscription[];

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

  public async generatePassword(): Promise<void> {
    const password = generatePassword.randomPassword({ length: 16 });
    this.setPassword(password);

    const { applicationTitle, applicationUrl } = getSettings().main;
    try {
      logger.info(`Sending generated password email for ${this.email}`, {
        label: 'User Management',
      });

      const email = new PreparedEmail(getSettings().notifications.agents.email);
      await email.send({
        template: path.join(__dirname, '../templates/email/generatedpassword'),
        message: { to: this.email },
        locals: {
          password: password,
          applicationUrl,
          applicationTitle,
          recipientName: this.username,
        },
      });
    } catch (e) {
      logger.error('Failed to send out generated password email', {
        label: 'User Management',
        message: e.message,
      });
    }
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
      await email.send({
        template: path.join(__dirname, '../templates/email/resetpassword'),
        message: { to: this.email },
        locals: {
          resetPasswordLink,
          applicationUrl,
          applicationTitle,
          recipientName: this.displayName,
          recipientEmail: this.email,
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
}
