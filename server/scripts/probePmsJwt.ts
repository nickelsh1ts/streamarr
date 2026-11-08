import dataSource from '@server/datasource';
import { probePmsJwtSupport } from '@server/lib/plexAuth/pmsProbe';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

/**
 * Standalone runner for the PMS JWT readiness probe.
 *
 * This is a developer-only diagnostic: it checks whether the local Plex
 * Media Server accepts the credential returned by plex.tv, distinguishing
 * legacy tokens from JWT-format credentials. Acceptance is scoped to the
 * tested endpoint, not full migration readiness. It is NOT wired into the
 * running app; run it manually every so often to re-check:
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
    const completed = await probePmsJwtSupport();
    if (completed) {
      logger.info(
        'PMS JWT probe completed. See the credential-specific result above.',
        { label: 'Plex JWT' }
      );
    } else {
      process.exitCode = 1;
    }
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
