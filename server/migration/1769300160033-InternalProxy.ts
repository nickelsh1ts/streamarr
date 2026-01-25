import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InternalProxy1769300160033 implements MigrationInterface {
  name = 'InternalProxy1769300160033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" text NOT NULL, "p256dh" text NOT NULL, "auth" text NOT NULL, "userAgent" text, "createdAt" datetime DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "FK_03f7958328e311761b0de675fbe" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_push_subscription"("id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId" FROM "user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "user_push_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_push_subscription" RENAME TO "user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" text NOT NULL DEFAULT (''), "region" text, "originalLanguage" text, "pgpKey" text, "sharedLibraries" text, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" text NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" text NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById" FROM "invite"`
    );
    await queryRunner.query(`DROP TABLE "invite"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_invite" RENAME TO "invite"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL DEFAULT ('local'), "categories" text, "description" text NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" text NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" integer NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (32), "avatar" varchar NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "temporary_user"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
    await queryRunner.query(
      `ALTER TABLE "invite" RENAME TO "temporary_invite"`
    );
    await queryRunner.query(
      `CREATE TABLE "invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" varchar NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" varchar NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_invite"`
    );
    await queryRunner.query(`DROP TABLE "temporary_invite"`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "sharedLibraries" varchar, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId", "trialPeriodEndsAt" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "user_push_subscription" RENAME TO "temporary_user_push_subscription"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_push_subscription" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "endpoint" varchar NOT NULL, "p256dh" varchar NOT NULL, "auth" varchar NOT NULL, "userAgent" varchar, "createdAt" datetime DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "FK_03f7958328e311761b0de675fbe" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_push_subscription"("id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId") SELECT "id", "endpoint", "p256dh", "auth", "userAgent", "createdAt", "userId" FROM "temporary_user_push_subscription"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_push_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
  }
}
