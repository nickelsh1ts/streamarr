import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationAgentsExtended1780213272078 implements MigrationInterface {
  name = 'NotificationAgentsExtended1780213272078';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notification_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_notifyUserId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" integer NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_updatedById" ON "notification" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_createdById" ON "notification" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_notifyUserId" ON "notification" ("notifyUserId") `
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" text NOT NULL DEFAULT (''), "region" text, "originalLanguage" text, "pgpKey" text, "sharedLibraries" text, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, "allowPlexHome" boolean NOT NULL DEFAULT (0), "trialPeriodOutcome" text, "trialExtensionRequested" boolean NOT NULL DEFAULT (0), "trialExtensionRequestedAt" datetime, "discordId" text, "pushbulletAccessToken" text, "pushoverApplicationToken" text, "pushoverUserKey" text, "pushoverSound" text, "telegramChatId" text, "telegramMessageThreadId" text, "telegramSendSilently" boolean NOT NULL DEFAULT (0), CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt", "allowPlexHome", "trialPeriodOutcome", "trialExtensionRequested", "trialExtensionRequestedAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt", "allowPlexHome", "trialPeriodOutcome", "trialExtensionRequested", "trialExtensionRequestedAt" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
    await queryRunner.query(`DROP INDEX "IDX_notification_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_notifyUserId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" text NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_updatedById" ON "notification" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_createdById" ON "notification" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_notifyUserId" ON "notification" ("notifyUserId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notification_notifyUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_updatedById"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" integer NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_notifyUserId" ON "notification" ("notifyUserId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_createdById" ON "notification" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_updatedById" ON "notification" ("updatedById") `
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" text NOT NULL DEFAULT (''), "region" text, "originalLanguage" text, "pgpKey" text, "sharedLibraries" text, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, "allowPlexHome" boolean NOT NULL DEFAULT (0), "trialPeriodOutcome" text, "trialExtensionRequested" boolean NOT NULL DEFAULT (0), "trialExtensionRequestedAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt", "allowPlexHome", "trialPeriodOutcome", "trialExtensionRequested", "trialExtensionRequestedAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt", "allowPlexHome", "trialPeriodOutcome", "trialExtensionRequested", "trialExtensionRequestedAt" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_notifyUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_updatedById"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" integer NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_notifyUserId" ON "notification" ("notifyUserId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_createdById" ON "notification" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_updatedById" ON "notification" ("updatedById") `
    );
  }
}
