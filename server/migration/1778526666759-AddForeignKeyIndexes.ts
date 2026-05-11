import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyIndexes1778526666759 implements MigrationInterface {
  name = 'AddForeignKeyIndexes1778526666759';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_user_push_subscription_userId" ON "user_push_subscription" ("userId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_createdById" ON "invite" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invite_updatedById" ON "invite" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_createdById" ON "event" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_updatedById" ON "event" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_notifyUserId" ON "notification" ("notifyUserId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_createdById" ON "notification" ("createdById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_updatedById" ON "notification" ("updatedById") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_redeemedInviteId" ON "user" ("redeemedInviteId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_redeemedInviteId"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_notification_notifyUserId"`);
    await queryRunner.query(`DROP INDEX "IDX_event_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_event_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_updatedById"`);
    await queryRunner.query(`DROP INDEX "IDX_invite_createdById"`);
    await queryRunner.query(`DROP INDEX "IDX_user_push_subscription_userId"`);
  }
}
