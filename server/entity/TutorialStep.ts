import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TutorialMode {
  SPOTLIGHT = 'spotlight',
  WIZARD = 'wizard',
  BOTH = 'both',
}

export enum TooltipPosition {
  AUTO = 'auto',
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
}

@Entity()
export class TutorialStep {
  constructor(init?: Partial<TutorialStep>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'integer', default: 0 })
  public order: number;

  @Column({ type: 'boolean', default: true })
  public enabled: boolean;

  @Column({
    type: 'text',
    default: TutorialMode.BOTH,
  })
  public mode: TutorialMode;

  @Column({ type: 'text' })
  public targetSelector: string;

  @Column({ type: 'text' })
  public title: string;

  @Column({ type: 'text' })
  public description: string;

  @Column({
    type: 'text',
    default: TooltipPosition.AUTO,
  })
  public tooltipPosition: TooltipPosition;

  @Column({ type: 'text', nullable: true })
  public route?: string;

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

export default TutorialStep;
