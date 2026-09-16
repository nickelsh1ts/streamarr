import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ShelfmarkIntegration1789342047467 implements MigrationInterface {
  name = 'ShelfmarkIntegration1789342047467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, "active" boolean NOT NULL DEFAULT (1), "accessRevokedAt" datetime, "accessRevokedReason" varchar, "plexJwt" text, "plexJwtExpiresAt" datetime, "plexJwtDevice" text, "audiobookshelfId" text, "audiobookshelfUsername" text, "audiobookshelfPassword" text, "audiobookshelfPwNotifiedAt" datetime, "shelfmarkUsername" text, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice", "audiobookshelfId", "audiobookshelfUsername", "audiobookshelfPassword", "audiobookshelfPwNotifiedAt") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice", "audiobookshelfId", "audiobookshelfUsername", "audiobookshelfPassword", "audiobookshelfPwNotifiedAt" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" text NOT NULL, "plexUsername" text, "username" text, "password" text, "resetPasswordGuid" text, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" text, "permissions" integer NOT NULL DEFAULT (32), "avatar" text NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, "active" boolean NOT NULL DEFAULT (1), "accessRevokedAt" datetime, "accessRevokedReason" varchar, "plexJwt" text, "plexJwtExpiresAt" datetime, "plexJwtDevice" text, "audiobookshelfId" text, "audiobookshelfUsername" text, "audiobookshelfPassword" text, "audiobookshelfPwNotifiedAt" datetime, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice", "audiobookshelfId", "audiobookshelfUsername", "audiobookshelfPassword", "audiobookshelfPwNotifiedAt") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId", "active", "accessRevokedAt", "accessRevokedReason", "plexJwt", "plexJwtExpiresAt", "plexJwtDevice", "audiobookshelfId", "audiobookshelfUsername", "audiobookshelfPassword", "audiobookshelfPwNotifiedAt" FROM "temporary_user"`
    );
    await queryRunner.query(`DROP TABLE "temporary_user"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
  }
}
