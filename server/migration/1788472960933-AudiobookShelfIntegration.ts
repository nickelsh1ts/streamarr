import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AudiobookShelfIntegration1788472960933 implements MigrationInterface {
  name = 'AudiobookShelfIntegration1788472960933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "newsletter"`
    );
    await queryRunner.query(`DROP TABLE "newsletter"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_newsletter" RENAME TO "newsletter"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_history_newsletterId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_newsletter_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "triggeredBy" text NOT NULL DEFAULT ('manual'), "recipientCount" integer NOT NULL DEFAULT (0), "failureCount" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "newsletterId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_newsletter_history"("id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId") SELECT "id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId" FROM "newsletter_history"`
    );
    await queryRunner.query(`DROP TABLE "newsletter_history"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_newsletter_history" RENAME TO "newsletter_history"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_history_newsletterId" ON "newsletter_history" ("newsletterId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, "active" boolean NOT NULL DEFAULT (1), "accessRevokedAt" datetime, "accessRevokedReason" varchar, "plexJwt" text, "plexJwtExpiresAt" datetime, "plexJwtDevice" text, "audiobookshelfId" text, "audiobookshelfUsername" text, "audiobookshelfPassword" text, "audiobookshelfPwNotifiedAt" datetime, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "FK_3382f74337b093fff042d2c00f7" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_fd150f46e258b3b5841c7fe9edf" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "newsletter"`
    );
    await queryRunner.query(`DROP TABLE "newsletter"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_newsletter" RENAME TO "newsletter"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_history_newsletterId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_newsletter_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "triggeredBy" text NOT NULL DEFAULT ('manual'), "recipientCount" integer NOT NULL DEFAULT (0), "failureCount" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "newsletterId" integer, CONSTRAINT "FK_76e3160ec7c52056b113beb825a" FOREIGN KEY ("newsletterId") REFERENCES "newsletter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_newsletter_history"("id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId") SELECT "id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId" FROM "newsletter_history"`
    );
    await queryRunner.query(`DROP TABLE "newsletter_history"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_newsletter_history" RENAME TO "newsletter_history"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_history_newsletterId" ON "newsletter_history" ("newsletterId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_newsletter_history_newsletterId"`);
    await queryRunner.query(
      `ALTER TABLE "newsletter_history" RENAME TO "temporary_newsletter_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "triggeredBy" text NOT NULL DEFAULT ('manual'), "recipientCount" integer NOT NULL DEFAULT (0), "failureCount" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "newsletterId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "newsletter_history"("id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId") SELECT "id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId" FROM "temporary_newsletter_history"`
    );
    await queryRunner.query(`DROP TABLE "temporary_newsletter_history"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_history_newsletterId" ON "newsletter_history" ("newsletterId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(
      `ALTER TABLE "newsletter" RENAME TO "temporary_newsletter"`
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_newsletter"`
    );
    await queryRunner.query(`DROP TABLE "temporary_newsletter"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, "active" boolean NOT NULL DEFAULT (1), "accessRevokedAt" datetime, "accessRevokedReason" varchar, "plexJwt" text, "plexJwtExpiresAt" datetime, "plexJwtDevice" text, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice" FROM "temporary_user"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_history_newsletterId"`);
    await queryRunner.query(
      `ALTER TABLE "newsletter_history" RENAME TO "temporary_newsletter_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "triggeredBy" text NOT NULL DEFAULT ('manual'), "recipientCount" integer NOT NULL DEFAULT (0), "failureCount" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "newsletterId" integer, CONSTRAINT "FK_newsletter_history_newsletterId" FOREIGN KEY ("newsletterId") REFERENCES "newsletter" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "newsletter_history"("id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId") SELECT "id", "triggeredBy", "recipientCount", "failureCount", "createdAt", "newsletterId" FROM "temporary_newsletter_history"`
    );
    await queryRunner.query(`DROP TABLE "temporary_newsletter_history"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_history_newsletterId" ON "newsletter_history" ("newsletterId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_newsletter_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_newsletter_updatedById"`);
    await queryRunner.query(
      `ALTER TABLE "newsletter" RENAME TO "temporary_newsletter"`
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "subject" text NOT NULL, "description" text, "body" text NOT NULL DEFAULT (''), "bodyFormat" text NOT NULL DEFAULT ('markdown'), "blocks" text, "recipientMode" text NOT NULL DEFAULT ('all'), "recipientIds" text, "isImportant" boolean NOT NULL DEFAULT (0), "enabled" boolean NOT NULL DEFAULT (0), "scheduleType" text NOT NULL DEFAULT ('recurring'), "cronSchedule" text, "sendAt" datetime, "lastSentAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "FK_newsletter_updatedById" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_newsletter_createdById" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "newsletter"("id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "name", "subject", "description", "body", "bodyFormat", "blocks", "recipientMode", "recipientIds", "isImportant", "enabled", "scheduleType", "cronSchedule", "sendAt", "lastSentAt", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_newsletter"`
    );
    await queryRunner.query(`DROP TABLE "temporary_newsletter"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_createdById" ON "newsletter" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_newsletter_updatedById" ON "newsletter" ("updatedById") `
    );
  }
}
