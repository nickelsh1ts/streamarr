import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TrialPeriodAccessOutcome1779845589398 implements MigrationInterface {
  name = 'TrialPeriodAccessOutcome1779845589398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_6427d07d9a171a3a1ab87480005"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" text NOT NULL DEFAULT (''), "region" text, "originalLanguage" text, "pgpKey" text, "sharedLibraries" text, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, "allowPlexHome" boolean NOT NULL DEFAULT (0), "trialPeriodOutcome" text, "trialExtensionRequested" boolean NOT NULL DEFAULT (0), "trialExtensionRequestedAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
    await queryRunner.query(`DROP INDEX "IDX_invite_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_createdById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" text NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" text NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, "trialPeriodOutcome" text, "trialPeriodDays" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById" FROM "invite"`
    );
    await queryRunner.query(`DROP TABLE "invite"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_invite" RENAME TO "invite"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_updatedById" ON "invite" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_createdById" ON "invite" ("createdById") `
    );
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, "active" boolean NOT NULL DEFAULT (1), "accessRevokedAt" datetime, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_user_push_subscription_userId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" text NOT NULL, "p256dh" text NOT NULL, "auth" text NOT NULL, "userAgent" text, "createdAt" datetime DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "UQ_6427d07d9a171a3a1ab87480005" UNIQUE ("endpoint", "userId"), CONSTRAINT "FK_03f7958328e311761b0de675fbe" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_push_subscription"("id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId" FROM "user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "user_push_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_push_subscription" RENAME TO "user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_push_subscription_userId" ON "user_push_subscription" ("userId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_push_subscription_userId"`);
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" RENAME TO "temporary_user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" text NOT NULL, "p256dh" text NOT NULL, "auth" text NOT NULL, "userAgent" text, "createdAt" datetime DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "FK_03f7958328e311761b0de675fbe" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_push_subscription"("id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId" FROM "temporary_user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_push_subscription"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_push_subscription_userId" ON "user_push_subscription" ("userId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "temporary_user"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_invite_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_updatedById"`);
    await queryRunner.query(
      `ALTER TABLE "invite" RENAME TO "temporary_invite"`
    );
    await queryRunner.query(
      `CREATE TABLE "invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" text NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" text NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_invite"`
    );
    await queryRunner.query(`DROP TABLE "temporary_invite"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_createdById" ON "invite" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_updatedById" ON "invite" ("updatedById") `
    );
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" text NOT NULL DEFAULT (''), "region" text, "originalLanguage" text, "pgpKey" text, "sharedLibraries" text, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_6427d07d9a171a3a1ab87480005" ON "user_push_subscription" ("endpoint", "userId") `
    );
  }
}
