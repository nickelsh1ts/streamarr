import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LocalCalendarEvent1755797267401 implements MigrationInterface {
  name = 'LocalCalendarEvent1755797267401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_68d16d8b0be7cd9a3b98cdbcf86" UNIQUE ("uid"), CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_68d16d8b0be7cd9a3b98cdbcf86" UNIQUE ("uid"), CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "event"`
    );
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "temporary_event" RENAME TO "event"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_68d16d8b0be7cd9a3b98cdbcf86" UNIQUE ("uid"), CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
    await queryRunner.query(`ALTER TABLE "event" RENAME TO "temporary_event"`);
    await queryRunner.query(
      `CREATE TABLE "event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar NOT NULL DEFAULT ('local'), "categories" varchar, "description" varchar NOT NULL, "end" datetime NOT NULL, "start" datetime NOT NULL, "status" text NOT NULL DEFAULT ('TENTATIVE'), "summary" varchar NOT NULL, "uid" text NOT NULL, "allDay" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_68d16d8b0be7cd9a3b98cdbcf86" UNIQUE ("uid"), CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ebd5032c5bc4ca401d847db089a" FOREIGN KEY ("updatedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "event"("id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById") SELECT "id", "type", "categories", "description", "end", "start", "status", "summary", "uid", "allDay", "createdAt", "updatedAt", "createdById", "updatedById" FROM "temporary_event"`
    );
    await queryRunner.query(`DROP TABLE "temporary_event"`);
  }
}
