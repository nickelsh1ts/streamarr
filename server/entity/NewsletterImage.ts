import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * An uploaded newsletter body image. Which newsletters use it is tracked by
 * `Newsletter.imageFilenames`, so retention outlives any single newsletter.
 */
@Entity()
export class NewsletterImage {
  @PrimaryColumn({ type: 'text' })
  public filename: string;

  /** Last non-test send that included this image. Null means never delivered. */
  @Column({ type: 'datetime', nullable: true })
  public lastDeliveredAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  public orphanedAt: Date | null;

  @CreateDateColumn()
  public createdAt: Date;

  constructor(init?: Partial<NewsletterImage>) {
    Object.assign(this, init);
  }
}

export default NewsletterImage;
