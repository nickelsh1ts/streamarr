import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InviteUserNullOnDelete1724116800000 implements MigrationInterface {
  name = 'InviteUserNullOnDelete1724116800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (0), "avatar" varchar NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "plexUsername" varchar, "username" varchar, "password" varchar, "resetPasswordGuid" varchar, "recoveryLinkExpirationDate" date, "userType" integer NOT NULL DEFAULT (1), "plexId" integer, "plexToken" varchar, "permissions" integer NOT NULL DEFAULT (0), "avatar" varchar NOT NULL, "inviteQuotaLimit" integer, "inviteQuotaDays" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "redeemedInviteId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_946f71fd3b363326811d818aa17" FOREIGN KEY ("redeemedInviteId") REFERENCES "invite" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_user"("id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId") SELECT "id", "email", "plexUsername", "username", "password", "resetPasswordGuid", "recoveryLinkExpirationDate", "userType", "plexId", "plexToken", "permissions", "avatar", "inviteQuotaLimit", "inviteQuotaDays", "createdAt", "updatedAt", "redeemedInviteId" FROM "user"`
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
  }
}
