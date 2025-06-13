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
class Invite {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'int', default: InviteStatus.VALID })
  public status: InviteStatus;

  @Column({ type: 'date', nullable: true })
  public expiresAt: Date;

  @Column()
  public code: string;

  @Column({ type: 'int', default: 0 })
  public uses: number;

  @Column({ type: 'int', default: 1 })
  public maxUses: number;

  @Column({ type: 'boolean', default: true })
  public downloads: boolean;

  @ManyToOne(() => User, (user) => user.createdInvites, {
    eager: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  public createdBy: User;

  @OneToMany(() => User, (user) => user.redeemedInvite, {
    eager: true,
    onDelete: 'CASCADE',
  })
  public redeemedBy: User[];

  @ManyToOne(() => User, (user) => user.modifiedInvites, {
    eager: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  public updatedBy?: User;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  constructor(init?: Partial<Invite>) {
    Object.assign(this, init);
  }
}

export default Invite;
