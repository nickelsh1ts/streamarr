import Newsletter from '@server/entity/Newsletter';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NewsletterTrigger = 'schedule' | 'manual' | 'test';

@Entity()
export class NewsletterHistory {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('IDX_newsletter_history_newsletterId')
  @ManyToOne(() => Newsletter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'newsletterId' })
  public newsletter: Newsletter;

  @Column({ type: 'text', default: 'manual' })
  public triggeredBy: NewsletterTrigger;

  @Column({ type: 'integer', default: 0 })
  public recipientCount: number;

  @Column({ type: 'integer', default: 0 })
  public failureCount: number;

  @CreateDateColumn()
  public createdAt: Date;

  constructor(init?: Partial<NewsletterHistory>) {
    Object.assign(this, init);
  }
}

export default NewsletterHistory;
