import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class UserOnboarding {
  constructor(init?: Partial<UserOnboarding>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User, (user) => user.onboarding, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @Column({ type: 'boolean', default: false })
  public welcomeCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  public welcomeCompletedAt?: Date;

  @Column({ type: 'boolean', default: false })
  public welcomeDismissed: boolean;

  @Column({ type: 'boolean', default: false })
  public tutorialCompleted: boolean;

  @Column({ type: 'datetime', nullable: true })
  public tutorialCompletedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      from: (value: string | null): number[] => {
        if (!value) {
          return [];
        }
        try {
          return JSON.parse(value) as number[];
        } catch {
          return [];
        }
      },
      to: (value: number[]): string | null => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return null;
        }
        return JSON.stringify(value);
      },
    },
  })
  public tutorialProgress: number[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  public completeWelcome(): void {
    this.welcomeCompleted = true;
    this.welcomeCompletedAt = new Date();
  }

  public dismissWelcome(): void {
    this.welcomeDismissed = true;
  }

  public completeTutorial(): void {
    this.tutorialCompleted = true;
    this.tutorialCompletedAt = new Date();
  }

  public addStepProgress(stepId: number): void {
    if (!this.tutorialProgress) {
      this.tutorialProgress = [];
    }
    if (!this.tutorialProgress.includes(stepId)) {
      this.tutorialProgress.push(stepId);
    }
  }

  public hasCompletedStep(stepId: number): boolean {
    return this.tutorialProgress?.includes(stepId) ?? false;
  }

  public reset(): void {
    this.welcomeCompleted = false;
    this.welcomeCompletedAt = null;
    this.welcomeDismissed = false;
    this.tutorialCompleted = false;
    this.tutorialCompletedAt = null;
    this.tutorialProgress = [];
  }
}

export default UserOnboarding;
