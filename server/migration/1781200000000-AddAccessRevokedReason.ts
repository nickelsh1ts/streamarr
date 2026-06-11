import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccessRevokedReason1781200000000 implements MigrationInterface {
  name = 'AddAccessRevokedReason1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "accessRevokedReason" varchar`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "accessRevokedReason"`
    );
  }
}
