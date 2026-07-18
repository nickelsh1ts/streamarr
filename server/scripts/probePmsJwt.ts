import dataSource from '@server/datasource';
import { probePmsJwtSupport } from '@server/lib/plexAuth/pmsProbe';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

/**
 * Standalone runner for the PMS JWT readiness probe.
 *
 * This is a developer-only diagnostic: it checks whether the local Plex
 * Media Server has begun accepting the server-scoped JWT that plex.tv mints,
 * which is the gate for retiring the legacy token entirely. It is NOT wired
 * into the running app; run it manually every so often to re-check:
 *
 *   pnpm probe:pms-jwt
 *
 * Requires an initialised database with an admin user that holds a fresh
 * JWT (i.e. experimental JWT auth has been enabled and the admin has signed
 * in since). Reads the same settings/config as the server.
 */
const run = async (): Promise<void> => {
  const dbConnection = await dataSource.initialize();
  try {
    await getSettings().load();
    logger.info('Starting PMS JWT probe…', { label: 'Plex JWT' });
    await probePmsJwtSupport();
    logger.info('PMS JWT probe successfully completed.', { label: 'Plex JWT' });
  } finally {
    await dbConnection.destroy();
  }
};

run().catch((e) => {
  logger.error('PMS JWT probe run failed', {
    label: 'Plex JWT',
    errorMessage: e instanceof Error ? e.message : String(e),
  });
  process.exit(1);
});
