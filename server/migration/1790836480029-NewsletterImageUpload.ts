import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NewsletterImageUpload1790836480029 implements MigrationInterface {
  name = 'NewsletterImageUpload1790836480029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "newsletter_image" ("filename" text PRIMARY KEY NOT NULL, "lastDeliveredAt" datetime, "orphanedAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, "imageFilenames" text, CONSTRAINT "FK_fd150f46e258b3b5841c7fe9edf" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3382f74337b093fff042d2c00f7" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "newsletter"`
    );
    await queryRunner.query(`DROP TABLE "newsletter"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_newsletter" RENAME TO "newsletter"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(
      `ALTER TABLE "newsletter" RENAME TO "temporary_newsletter"`
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "FK_fd150f46e258b3b5841c7fe9edf" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_3382f74337b093fff042d2c00f7" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_newsletter"`
    );
    await queryRunner.query(`DROP TABLE "temporary_newsletter"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(`DROP TABLE "newsletter_image"`);
  }
}
