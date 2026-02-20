import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WelcomeContentType {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class WelcomeContent {
  constructor(init?: Partial<WelcomeContent>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'text',
    default: WelcomeContentType.USER,
  })
  public type: WelcomeContentType;

  @Column({ type: 'integer', default: 0 })
  public order: number;

  @Column({ type: 'boolean', default: true })
  public enabled: boolean;

  @Column({ type: 'text' })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public description?: string;

  @Column({ type: 'text', nullable: true })
  public imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  public videoUrl?: string;

  @Column({ type: 'boolean', default: false })
  public videoAutoplay: boolean;

  @Column({ type: 'text', nullable: true })
  public customHtml?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}

export default WelcomeContent;
