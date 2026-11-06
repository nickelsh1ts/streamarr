import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionUserIndex1793911720191 implements MigrationInterface {
  name = 'SessionUserIndex1793911720191';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_28c5d1d16da7908c97c9bc2f74"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_session" ("expiredAt" bigint NOT NULL, "id" varchar(255) PRIMARY KEY NOT NULL, "json" text NOT NULL, "deletedAt" datetime, "userId" integer AS (json_extract("json", '$.userId')) VIRTUAL)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_session"("expiredAt", "id", "json", "deletedAt") SELECT "expiredAt", "id", "json", "deletedAt" FROM "session"`
    );
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_session" RENAME TO "session"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28c5d1d16da7908c97c9bc2f74" ON "session" ("expiredAt") `
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (NULL, NULL, ?, ?, ?, ?)`,
      [
        'session',
        'GENERATED_COLUMN',
        'userId',
        'json_extract("json", \'$.userId\')',
      ]
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_3d2f174ef04fb312fdebd0ddc5"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = ? AND "name" = ? AND "table" = ?`,
      ['GENERATED_COLUMN', 'userId', 'session']
    );
    await queryRunner.query(`DROP INDEX "IDX_28c5d1d16da7908c97c9bc2f74"`);
    await queryRunner.query(
      `ALTER TABLE "session" RENAME TO "temporary_session"`
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("expiredAt" bigint NOT NULL, "id" varchar(255) PRIMARY KEY NOT NULL, "json" text NOT NULL, "deletedAt" datetime)`
    );
    await queryRunner.query(
      `INSERT INTO "session"("expiredAt", "id", "json", "deletedAt") SELECT "expiredAt", "id", "json", "deletedAt" FROM "temporary_session"`
    );
    await queryRunner.query(`DROP TABLE "temporary_session"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_28c5d1d16da7908c97c9bc2f74" ON "session" ("expiredAt") `
    );
  }
}
