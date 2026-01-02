import { InviteStatus } from '@server/constants/invite';
import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import type { InviteBody } from '@server/interfaces/api/inviteInterfaces';
import { getRepository } from '@server/datasource';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';

export class InvitePermissionError extends Error {}
export class QuotaRestrictedError extends Error {}
export class DuplicateInviteError extends Error {}

@Entity()
export class Invite {
  public static async invite(
    inviteBody: InviteBody,
    user: User
  ): Promise<Invite> {
    const inviteRepository = getRepository(Invite);
    const userRepository = getRepository(User);

    let inviteUser = user;

    if (
      inviteBody.userId &&
      !inviteUser.hasPermission([
        Permission.MANAGE_USERS,
        Permission.MANAGE_INVITES,
      ])
    ) {
      throw new InvitePermissionError(
        'You do not have permission to modify the invite user.'
      );
    } else if (inviteBody.userId) {
      inviteUser = await userRepository.findOneOrFail({
        where: { id: inviteBody.userId },
      });
    }

    if (!inviteUser) {
      throw new Error('User missing from invite context.');
    }

    const quotas = await inviteUser.getQuota();

    if (quotas.invite.restricted) {
      throw new QuotaRestrictedError('Invite Quota exceeded.');
    }

    const existing = await inviteRepository
      .createQueryBuilder('invite')
      .where('invite.icode = :icode', { icode: inviteBody.icode })
      .getMany();

    if (existing && existing.length > 0) {
      logger.warn('Duplicate code for invite blocked', {
        label: 'Invite',
      });

      throw new DuplicateInviteError('Invite with this code already exists.');
    }

    const invite = new Invite({
      createdBy: inviteUser,
      icode: inviteBody.icode,
      status: InviteStatus.ACTIVE,
      updatedBy: user.hasPermission([Permission.MANAGE_INVITES])
        ? user
        : undefined,
    });

    await inviteRepository.save(invite);
    return invite;
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'int', default: InviteStatus.ACTIVE })
  public status: InviteStatus;

  @Column({ type: 'datetime', nullable: true })
  public expiresAt: Date;

  @Column({ type: 'text', unique: true })
  public icode: string;

  @Column({ type: 'int', default: 0 })
  public uses: number;

  @Column({ type: 'int', default: 1 })
  public usageLimit: number;

  @Column({ type: 'boolean', default: true })
  public downloads: boolean;

  @Column({ type: 'boolean', default: false })
  public liveTv: boolean;

  @Column({ type: 'boolean', default: false })
  public plexHome: boolean;

  @Column({ type: 'int', default: 1 })
  public expiryLimit: number;

  @Column({ type: 'text', default: '' })
  public expiryTime: 'days' | 'weeks' | 'months';

  @Column({ type: 'text', default: '' })
  public sharedLibraries: string;

  @ManyToOne(() => User, (user) => user.createdInvites, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  public createdBy: User;

  @OneToMany(() => User, (user) => user.redeemedInvite, {
    eager: true,
  })
  public redeemedBy: User[];

  @ManyToOne(() => User, (user) => user.modifiedInvites, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  public updatedBy: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Invite>) {
    Object.assign(this, init);
  }

  @AfterLoad()
  updateStatusIfExpired() {
    // Only check expiry for invites that are NOT already EXPIRED or REDEEMED
    // REDEEMED invites should stay REDEEMED forever, regardless of expiry time
    if (
      this.expiryLimit !== 0 &&
      this.status !== InviteStatus.EXPIRED &&
      this.status !== InviteStatus.REDEEMED
    ) {
      let msPerUnit = 86400000;
      if (this.expiryTime === 'weeks') msPerUnit = 604800000;
      if (this.expiryTime === 'months') msPerUnit = 2629800000;
      const expiryDate = new Date(
        this.createdAt.getTime() + this.expiryLimit * msPerUnit
      );
      if (Date.now() > expiryDate.getTime()) {
        this.status = InviteStatus.EXPIRED;
      }
    }
  }
}

export default Invite;
