import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

/**
 * PMS JWT readiness probe (developer diagnostic).
 *
 * As of the current PMS releases, the media server rejects all JWTs —
 * including the server-scoped JWTs that plex.tv already mints in
 * /api/v2/resources. The full cutover (PMS calls + /watch on JWTs, legacy
 * retired) is blocked until Plex ships PMS-side validation.
 *
 * This probe exchanges the admin's account JWT for the server-scoped JWT via
 * /api/v2/resources and tests it against the local PMS. The day PMS starts
 * accepting it, a prominent log line announces that the full JWT cutover has
 * become possible.
 *
 * It is intentionally NOT wired into the running app. Invoke it on demand
 * via `pnpm probe:pms-jwt` to re-check periodically.
 */

interface PlexResource {
  clientIdentifier?: string;
  provides?: string;
  owned?: boolean;
  accessToken?: string | null;
}

const LABEL = 'Plex JWT';
const PROBE_TIMEOUT_MS = 10000;

export const probePmsJwtSupport = async (): Promise<void> => {
  const settings = getSettings();

  if (!settings.main.experimentalJwtAuth) {
    logger.error(
      'PMS JWT probe failed: experimental JWT auth is disabled in settings.',
      { label: LABEL }
    );
    return;
  }
  if (!settings.plex.ip || !settings.plex.machineId) {
    logger.error(
      'PMS JWT probe failed: Plex server is not configured (missing ip or machineId). Complete Plex setup first.',
      {
        label: LABEL,
        hasIp: !!settings.plex.ip,
        hasMachineId: !!settings.plex.machineId,
      }
    );
    return;
  }

  try {
    const admin = await getRepository(User)
      .createQueryBuilder('user')
      .addSelect(['user.plexJwt', 'user.plexJwtExpiresAt'])
      .where('user.id = :id', { id: 1 })
      .getOne();

    if (!admin?.plexJwt) {
      logger.error(
        'PMS JWT probe failed: the admin user has no provisioned JWT yet. Enable experimental JWT auth, then have the admin sign in via Plex so a JWT device is provisioned, and try again.',
        { label: LABEL }
      );
      return;
    }
    if (
      !admin.plexJwtExpiresAt ||
      admin.plexJwtExpiresAt.getTime() <= Date.now()
    ) {
      logger.error(
        'PMS JWT probe failed: the admin JWT has expired. Have the admin sign in again (or wait for the refresh job) to renew it, then re-run.',
        { label: LABEL, expiresAt: admin.plexJwtExpiresAt ?? null }
      );
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

    if (!server) {
      logger.error(
        'PMS JWT probe failed: this machine id was not found among the JWT-scoped resources returned by plex.tv. The account JWT may not have access to this server.',
        { label: LABEL, machineId: settings.plex.machineId }
      );
      return;
    }
    if (!server.accessToken) {
      logger.error(
        'PMS JWT Probe failed: Plex.tv did not mint a server-scoped access token for this server under the JWT.',
        { label: LABEL, machineId: settings.plex.machineId }
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
        'PMS JWT probe Successful: SUPPORTED! Plex Media Server now ACCEPTS server-scoped JWTs. The full JWT cutover (PMS calls and /watch on JWTs, retiring the legacy token) has become possible.',
        { label: LABEL, pmsStatus: response.status }
      );
    } else {
      logger.info(
        'PMS JWT probe Successful: STILL UNSUPPORTED — the media server rejected the server-scoped JWT.',
        { label: LABEL, pmsStatus: response.status }
      );
    }
  } catch (e) {
    logger.error(
      'PMS JWT probe failed: Something went wrong while probing the Plex Media Server for JWT support.',
      {
        label: LABEL,
        errorMessage: e instanceof Error ? e.message : String(e),
      }
    );
  }
};
