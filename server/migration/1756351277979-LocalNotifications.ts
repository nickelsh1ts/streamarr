import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LocalNotifications1756351277979 implements MigrationInterface {
  name = 'LocalNotifications1756351277979';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer)`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "sendNotification" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_4d47abd5a12645e80cfa987c917" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_fd1e91ef5276d4bd640d21bb74f" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (32), "avatar" varchar NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer, CONSTRAINT "FK_dfeae7391fb8841a2ee4c4f6432" FOREIGN KEY ("notifyUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_ab94760702f01d400c4e845fbe6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_896e73a28e268aaf00e098b9b89" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "notification"`
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_notification" RENAME TO "notification"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" RENAME TO "temporary_notification"`
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" integer NOT NULL, "severity" varchar NOT NULL DEFAULT ('info'), "subject" text NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT (0), "actionUrl" text, "actionUrlTitle" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "notifyUserId" integer, "createdById" integer, "updatedById" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "notification"("id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById") SELECT "id", "type", "severity", "subject", "message", "isRead", "actionUrl", "actionUrlTitle", "createdAt", "updatedAt", "notifyUserId", "createdById", "updatedById" FROM "temporary_notification"`
    );
    await queryRunner.query(`DROP TABLE "temporary_notification"`);
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (0), "avatar" varchar NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "temporary_user"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_8e5f60ed922f3daf06a8d6c77e8" UNIQUE ("uid"), CONSTRAINT "FK_4d47abd5a12645e80cfa987c917" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_fd1e91ef5276d4bd640d21bb74f" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
    await queryRunner.query(`DROP TABLE "notification"`);
  }
}
