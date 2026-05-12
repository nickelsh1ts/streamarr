import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { EventBody } from '@server/interfaces/api/eventInterfaces';
import { Permission } from '@server/lib/permissions';
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

@Entity()
export class Event {
  public static async event(eventBody: EventBody, user: User): Promise<Event> {
    const eventRepository = getRepository(Event);
    const userRepository = getRepository(User);

    let eventUser = user;

    if (
      eventBody.userId &&
      !eventUser.hasPermission(
        [Permission.CREATE_EVENTS, Permission.MANAGE_EVENTS],
        { type: 'or' }
      )
    ) {
      throw new Error('User does not have permission to manage events');
    } else if (eventBody.userId) {
      eventUser = await userRepository.findOneOrFail({
        where: { id: eventBody.userId },
      });
    }

    if (!eventUser) {
      throw new Error('User missing from event context');
    }

    const event = new Event({
      createdBy: eventUser,
    });

    await eventRepository.save(event);
    return event;
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text', default: 'local' })
  public type: 'local';

  @Column({ type: 'text', nullable: true })
  public categories: string;

  @Column('text')
  public description: string;

  @Column({ type: 'datetime' })
  public end: Date;

  @Column({ type: 'datetime' })
  public start: Date;

  @Column({ type: 'text', default: 'TENTATIVE' })
  public status: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';

  @Column('text')
  public summary: string;

  @Column({ type: 'text', unique: true })
  public uid: string;

  @Column({ type: 'boolean', default: false })
  public allDay: boolean;

  @Column({ type: 'boolean', default: false })
  public sendNotification: boolean;

  @Index('IDX_event_createdById')
  @ManyToOne(() => User, (user) => user.createdEvents, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdById' })
  public createdBy: User;

  @Index('IDX_event_updatedById')
  @ManyToOne(() => User, (user) => user.modifiedEvents, {
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

  constructor(init?: Partial<Event>) {
    Object.assign(this, init);
  }
}

export default Event;
