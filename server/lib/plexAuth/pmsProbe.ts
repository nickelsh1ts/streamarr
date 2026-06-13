import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

/**
 * PMS JWT readiness probe.
 *
 * As of PMS 1.43.2, the media server rejects all JWTs — including the
 * server-scoped JWTs that plex.tv already mints in /api/v2/resources
 * The full cutover (PMS calls + /watch on JWTs, legacy retired)
 * is blocked until Plex ships PMS-side validation.
 *
 * This probe runs once per refresh-job cycle: it exchanges the admin's
 * account JWT for the server-scoped JWT via /api/v2/resources and tests it
 * against the local PMS. The day PMS starts accepting it, a prominent log
 * line announces that the full JWT cutover has become possible.
 */

interface PlexResource {
  clientIdentifier?: string;
  provides?: string;
  owned?: boolean;
  accessToken?: string | null;
}

const PROBE_TIMEOUT_MS = 10000;

export const probePmsJwtSupport = async (): Promise<void> => {
  const settings = getSettings();
  if (
    !settings.main.experimentalJwtAuth ||
    !settings.plex.ip ||
    !settings.plex.machineId
  ) {
    return;
  }

  try {
    const admin = await getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.plexJwt')
      .where('user.id = :id', { id: 1 })
      .getOne();

    if (
      !admin?.plexJwt ||
      !admin.plexJwtExpiresAt ||
      admin.plexJwtExpiresAt.getTime() <= Date.now()
    ) {
      return;
    }

    // Exchange the account JWT for the server-scoped JWT
    const resources = await axios.get<PlexResource[]>(
      'https://clients.plex.tv/api/v2/resources?includeHttps=1',
      {
        headers: {
          Accept: 'application/json',
          'X-Plex-Token': admin.plexJwt,
          'X-Plex-Client-Identifier': settings.clientId,
        },
        timeout: PROBE_TIMEOUT_MS,
      }
    );

    const server = resources.data.find(
      (r) =>
        r.clientIdentifier === settings.plex.machineId &&
        (r.provides ?? '').includes('server')
    );

    if (!server?.accessToken) {
      logger.debug(
        'PMS JWT probe: no server access token returned for this machine id',
        { label: 'Plex JWT' }
      );
      return;
    }

    const protocol = settings.plex.useSsl ? 'https' : 'http';
    const response = await axios.get(
      `${protocol}://${settings.plex.ip}:${settings.plex.port}/library/sections`,
      {
        headers: {
          Accept: 'application/json',
          'X-Plex-Token': server.accessToken,
          'X-Plex-Client-Identifier': settings.clientId,
        },
        timeout: PROBE_TIMEOUT_MS,
        validateStatus: () => true,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      logger.info(
        '*** Plex Media Server now ACCEPTS server-scoped JWTs. The full JWT cutover (issue #322 Phase 5: PMS calls and /watch on JWTs) has become possible — review the migration plan. ***',
        { label: 'Plex JWT', pmsStatus: response.status }
      );
    } else {
      logger.debug(
        'PMS JWT probe: media server still rejects server-scoped JWTs',
        { label: 'Plex JWT', pmsStatus: response.status }
      );
    }
  } catch (e) {
    logger.debug('PMS JWT probe failed; will retry next cycle', {
      label: 'Plex JWT',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
};
