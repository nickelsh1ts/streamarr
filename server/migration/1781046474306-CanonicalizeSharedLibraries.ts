import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CanonicalizeSharedLibraries1781046474306 implements MigrationInterface {
  name = 'CanonicalizeSharedLibraries1781046474306';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "user_settings" SET "sharedLibraries" = NULL WHERE "sharedLibraries" IN ('', 'server')`
    );
    await queryRunner.query(
      `UPDATE "user_settings" SET "sharedLibraries" = REPLACE("sharedLibraries", ',', '|') WHERE "sharedLibraries" LIKE '%,%'`
    );
    await queryRunner.query(`DROP INDEX "IDX_invite_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_createdById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" text NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, "trialPeriodOutcome" text, "trialPeriodDays" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById", "trialPeriodOutcome", "trialPeriodDays") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById", "trialPeriodOutcome", "trialPeriodDays" FROM "invite"`
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

    await queryRunner.query(
      `UPDATE "invite" SET "sharedLibraries" = NULL WHERE "sharedLibraries" IN ('', 'server')`
    );
    await queryRunner.query(
      `UPDATE "invite" SET "sharedLibraries" = REPLACE("sharedLibraries", ',', '|') WHERE "sharedLibraries" LIKE '%,%'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "invite" SET "sharedLibraries" = '' WHERE "sharedLibraries" IS NULL`
    );
    await queryRunner.query(`DROP INDEX "IDX_invite_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_updatedById"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "status" integer NOT NULL DEFAULT (2), "expiresAt" datetime, "icode" text NOT NULL, "uses" integer NOT NULL DEFAULT (0), "usageLimit" integer NOT NULL DEFAULT (1), "downloads" boolean NOT NULL DEFAULT (1), "liveTv" boolean NOT NULL DEFAULT (0), "plexHome" boolean NOT NULL DEFAULT (0), "expiryLimit" integer NOT NULL DEFAULT (1), "expiryTime" text NOT NULL DEFAULT (''), "sharedLibraries" text NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, "trialPeriodOutcome" text, "trialPeriodDays" integer, CONSTRAINT "UQ_7f7a754388878d18dbdfabb1000" UNIQUE ("icode"), CONSTRAINT "FK_1fd4ebf122b26dc6c7245e544f3" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ec6eb73bd3f57afbf7cb68da10b" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_invite"("id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById", "trialPeriodOutcome", "trialPeriodDays") SELECT "id", "status", "expiresAt", "icode", "uses", "usageLimit", "downloads", "liveTv", "plexHome", "expiryLimit", "expiryTime", "sharedLibraries", "createdAt", "updatedAt", "createdById", "updatedById", "trialPeriodOutcome", "trialPeriodDays" FROM "invite"`
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
  }
}
