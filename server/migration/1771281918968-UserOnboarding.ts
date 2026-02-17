import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOnboarding1771281918968 implements MigrationInterface {
  name = 'UserOnboarding1771281918968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_onboarding" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "welcomeCompleted" boolean NOT NULL DEFAULT (0), "welcomeCompletedAt" datetime, "welcomeDismissed" boolean NOT NULL DEFAULT (0), "tutorialCompleted" boolean NOT NULL DEFAULT (0), "tutorialCompletedAt" datetime, "tutorialProgress" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "REL_f3e7bb4005372c40076e8af93c" UNIQUE ("userId"))`
    );
    await queryRunner.query(
      `CREATE TABLE "welcome_content" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL DEFAULT ('user'), "order" integer NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (1), "title" text NOT NULL, "description" text, "imageUrl" text, "videoUrl" text, "videoAutoplay" boolean NOT NULL DEFAULT (0), "customHtml" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `CREATE TABLE "tutorial_step" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "order" integer NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (1), "mode" text NOT NULL DEFAULT ('both'), "targetSelector" text NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "tooltipPosition" text NOT NULL DEFAULT ('auto'), "route" text, "imageUrl" text, "videoUrl" text, "videoAutoplay" boolean NOT NULL DEFAULT (0), "customHtml" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_onboarding" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "welcomeCompleted" boolean NOT NULL DEFAULT (0), "welcomeCompletedAt" datetime, "welcomeDismissed" boolean NOT NULL DEFAULT (0), "tutorialCompleted" boolean NOT NULL DEFAULT (0), "tutorialCompletedAt" datetime, "tutorialProgress" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "REL_f3e7bb4005372c40076e8af93c" UNIQUE ("userId"), CONSTRAINT "FK_f3e7bb4005372c40076e8af93ca" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_onboarding"("id", "welcomeCompleted", "welcomeCompletedAt", "welcomeDismissed", "tutorialCompleted", "tutorialCompletedAt", "tutorialProgress", "createdAt", "updatedAt", "userId") SELECT "id", "welcomeCompleted", "welcomeCompletedAt", "welcomeDismissed", "tutorialCompleted", "tutorialCompletedAt", "tutorialProgress", "createdAt", "updatedAt", "userId" FROM "user_onboarding"`
    );
    await queryRunner.query(`DROP TABLE "user_onboarding"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_onboarding" RENAME TO "user_onboarding"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_onboarding" RENAME TO "temporary_user_onboarding"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_onboarding" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "welcomeCompleted" boolean NOT NULL DEFAULT (0), "welcomeCompletedAt" datetime, "welcomeDismissed" boolean NOT NULL DEFAULT (0), "tutorialCompleted" boolean NOT NULL DEFAULT (0), "tutorialCompletedAt" datetime, "tutorialProgress" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "REL_f3e7bb4005372c40076e8af93c" UNIQUE ("userId"))`
    );
    await queryRunner.query(
      `INSERT INTO "user_onboarding"("id", "welcomeCompleted", "welcomeCompletedAt", "welcomeDismissed", "tutorialCompleted", "tutorialCompletedAt", "tutorialProgress", "createdAt", "updatedAt", "userId") SELECT "id", "welcomeCompleted", "welcomeCompletedAt", "welcomeDismissed", "tutorialCompleted", "tutorialCompletedAt", "tutorialProgress", "createdAt", "updatedAt", "userId" FROM "temporary_user_onboarding"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_onboarding"`);
    await queryRunner.query(`DROP TABLE "tutorial_step"`);
    await queryRunner.query(`DROP TABLE "welcome_content"`);
    await queryRunner.query(`DROP TABLE "user_onboarding"`);
  }
}
