import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrialPeriod1763231537246 implements MigrationInterface {
  name = 'AddTrialPeriod1763231537246';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "sharedLibraries" varchar, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, "trialPeriodEndsAt" datetime, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId" FROM "user_settings"`
    );
    await queryRunner.query(`DROP TABLE "user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_user_settings" RENAME TO "user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"))`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(
      `ALTER TABLE "user_settings" RENAME TO "temporary_user_settings"`
    );
    await queryRunner.query(
      `CREATE TABLE "user_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "locale" varchar NOT NULL DEFAULT (''), "region" varchar, "originalLanguage" varchar, "pgpKey" varchar, "sharedLibraries" varchar, "allowDownloads" boolean NOT NULL DEFAULT (0), "allowLiveTv" boolean NOT NULL DEFAULT (0), "notificationTypes" text, "userId" integer, CONSTRAINT "REL_986a2b6d3c05eb4091bb8066f7" UNIQUE ("userId"), CONSTRAINT "FK_986a2b6d3c05eb4091bb8066f78" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user_settings"("id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId") SELECT "id", "locale", "region", "originalLanguage", "pgpKey", "sharedLibraries", "allowDownloads", "allowLiveTv", "notificationTypes", "userId" FROM "temporary_user_settings"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user_settings"`);
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_fd1e91ef5276d4bd640d21bb74f" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_4d47abd5a12645e80cfa987c917" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "sendNotification", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
  }
}
