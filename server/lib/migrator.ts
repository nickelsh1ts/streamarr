import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';

const moduleRequire = createRequire(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = (
  settings: AllSettings,
  settingsPath: string
): Promise<AllSettings> => {
  let migrated = settings;

  return (async () => {
    try {
      const backupPath = settingsPath.replace('.json', '.old.json');
      let oldBackup: string | null = null;
      try {
        oldBackup = await fs.readFile(backupPath, 'utf-8');
      } catch {
        // No existing backup — that's fine.
      }
      await fs.writeFile(backupPath, JSON.stringify(settings, undefined, ' '));

      const migrations = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
        .sort();

      const settingsBefore = JSON.stringify(migrated);

      for (const migration of migrations) {
        try {
          const mod = moduleRequire(path.join(migrationsDir, migration));
          const migrationFn: (
            settings: AllSettings
          ) => AllSettings | Promise<AllSettings> =
            typeof mod === 'function' ? mod : (mod.default ?? mod);
          const newSettings = await migrationFn(structuredClone(migrated));

          if (JSON.stringify(migrated) !== JSON.stringify(newSettings)) {
            logger.debug(
              `Applied settings migration '${migration.replace(/\.ts$|\.js$/, '')}'.`,
              {
                label: 'Migrations',
              }
            );
          }

          migrated = newSettings;
        } catch (e) {
          logger.error(
            `Error while running migration '${migration.replace(/\.ts$|\.js$/, '')}': ${e.message}\n${e.stack}`,
            { label: 'Migrations' }
          );
          throw e;
        }
      }

      const settingsAfter = JSON.stringify(migrated);
      if (settingsBefore !== settingsAfter) {
        await fs.writeFile(
          settingsPath,
          JSON.stringify(migrated, undefined, ' ')
        );
        const fileSaved = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        if (JSON.stringify(fileSaved) !== settingsAfter) {
          throw new Error('Unable to save settings during migration.');
        }
        // Migration succeeded — remove the backup file.
        await fs.unlink(backupPath).catch(() => {
          // Non-fatal if the backup couldn't be removed.
        });
      } else {
        if (oldBackup) {
          await fs.writeFile(backupPath, oldBackup);
        } else {
          await fs.unlink(backupPath).catch(() => {
            // Non-fatal if already gone.
          });
        }
      }
    } catch (e) {
      logger.error(
        `Something went wrong while running settings migrations: ${e.message}`,
        { label: 'Migrations' }
      );
      throw e;
    }

    return migrated;
  })();
};
