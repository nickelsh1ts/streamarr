import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Newsletters1781400000000 implements MigrationInterface {
  name = 'Newsletters1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "FK_newsletter_createdById" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_newsletter_updatedById" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "triggeredBy" text NOT NULL DEFAULT ('manual'), "recipientCount" integer NOT NULL DEFAULT (0), "failureCount" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "newsletterId" integer, CONSTRAINT "FK_newsletter_history_newsletterId" FOREIGN KEY ("newsletterId") REFERENCES "newsletter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_history_newsletterId" ON "newsletter_history" ("newsletterId") `
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD COLUMN "unsubscribedNewsletters" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "unsubscribedNewsletters"`
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_history_newsletterId"`);
    await queryRunner.query(`DROP TABLE "newsletter_history"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(`DROP TABLE "newsletter"`);
  }
}
