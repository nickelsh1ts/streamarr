import { InviteStatus } from '@server/constants/invite';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class Invite {
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
  public expiryTime: '' | 'days' | 'weeks' | 'months';

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

  /**
   * Get the expiry date. Returns null if invite never expires.
   */
  public getExpiryDate(): Date | null {
    return this.expiresAt ? new Date(this.expiresAt) : null;
  }

  /**
   * Check if invite is expired based on time.
   */
  public isExpired(): boolean {
    return this.expiresAt
      ? Date.now() > new Date(this.expiresAt).getTime()
      : false;
  }
}

export default Invite;
