import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PlexJwtAuth1781296351378 implements MigrationInterface {
  name = 'PlexJwtAuth1781296351378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "plexJwt" text`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "plexJwtExpiresAt" datetime`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "plexJwtDevice" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Requires SQLite >= 3.35 (bundled with the sqlite3 driver in use)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "plexJwtDevice"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "plexJwtExpiresAt"`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "plexJwt"`);
  }
}
