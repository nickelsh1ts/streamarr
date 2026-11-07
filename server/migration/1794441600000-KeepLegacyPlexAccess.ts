import PlexTvAPI from '@server/api/plextv';
import logger from '@server/logger';
import { sharedLibrariesFromShare } from '@server/utils/sharedLibraries';
import fs from 'fs';
import path from 'path';
import type { MigrationInterface, QueryRunner } from 'typeorm';

const SETTINGS_PATH = process.env.CONFIG_DIRECTORY
  ? `${process.env.CONFIG_DIRECTORY}/settings.json`
  : path.join(__dirname, '../../config/settings.json');

/**
 * Shared-library defaults are now live. Plex users who were never assigned
 * libraries keep their current Plex access instead of being moved to the
 * server default on the next sync. Best effort: if Plex is unreachable, the
 * affected users are logged for review rather than blocking startup.
 */
export class KeepLegacyPlexAccess1794441600000 implements MigrationInterface {
  name = 'KeepLegacyPlexAccess1794441600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const users: {
      id: number;
      email: string;
      plexId: number | null;
      plexUsername: string | null;
      settingsId: number | null;
    }[] = await queryRunner.query(
      `SELECT "user"."id", "user"."email", "user"."plexId", "user"."plexUsername", "user_settings"."id" AS "settingsId" FROM "user" LEFT JOIN "user_settings" ON "user_settings"."userId" = "user"."id" WHERE "user"."id" != 1 AND "user"."userType" = 1 AND "user_settings"."sharedLibraries" IS NULL`
    );
    if (users.length === 0) {
      return;
    }

    try {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      const [admin] = await queryRunner.query(
        `SELECT "plexToken" FROM "user" WHERE "id" = 1`
      );
      const machineId: string | undefined = settings.plex?.machineId;
      if (!admin?.plexToken || !machineId) {
        throw new Error('Plex is not configured');
      }

      const api = new PlexTvAPI(admin.plexToken);
      const plexUsers = await api.getUsers();
      const options = {
        adminDefault: settings.main?.sharedLibraries,
        enabledLibraries: (settings.plex.libraries ?? []).filter(
          (library: { enabled: boolean }) => library.enabled
        ),
      };

      const kept: { email: string; libraries: string }[] = [];
      for (const user of users) {
        const share = await api.getUserShare(
          {
            plexId: user.plexId ?? undefined,
            email: user.email,
            username: user.plexUsername ?? undefined,
          },
          machineId,
          plexUsers
        );
        if (!share) {
          continue;
        }
        const libraries = sharedLibrariesFromShare(share, options);
        await queryRunner.query(
          user.settingsId
            ? `UPDATE "user_settings" SET "sharedLibraries" = ?, "allowDownloads" = ? WHERE "id" = ?`
            : `INSERT INTO "user_settings" ("sharedLibraries", "allowDownloads", "userId") VALUES (?, ?, ?)`,
          [libraries, share.allowSync ? 1 : 0, user.settingsId ?? user.id]
        );
        if (libraries) {
          kept.push({ email: user.email, libraries });
        }
      }

      if (kept.length > 0) {
        logger.warn(
          `Shared libraries upgrade: ${kept.length} user(s) without assigned libraries kept their existing Plex access. Set them to Default under Users if they should follow the server default.`,
          { label: 'Migrations', users: kept }
        );
      }
    } catch (e) {
      logger.warn(
        'Shared libraries upgrade could not read Plex access. These users now follow the server default; review them before changing the default or enabled libraries.',
        {
          label: 'Migrations',
          users: users.map((user) => user.email),
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
    }
  }

  public async down(): Promise<void> {
    // Adopted libraries are valid explicit values; nothing to revert
  }
}
