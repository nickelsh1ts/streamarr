import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

/**
 * PMS JWT readiness probe (developer diagnostic).
 *
 * Since Plex's November 4, 2026 compatibility fix, /api/v2/resources can
 * return a legacy token even when authenticated with an account JWT. Plex
 * intends to switch that credential to a JWT when PMS supports it.
 *
 * This probe checks the returned credential's format and tests it against
 * /library/sections, with an unauthenticated control request. JWT acceptance
 * here does not establish readiness for /watch or other PMS workflows.
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

export const probePmsJwtSupport = async (): Promise<boolean> => {
  const settings = getSettings();

  if (!settings.main.experimentalJwtAuth) {
    logger.error(
      'PMS JWT probe failed: experimental JWT auth is disabled in settings.',
      { label: LABEL }
    );
    return false;
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
    return false;
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
      return false;
    }
    if (
      !admin.plexJwtExpiresAt ||
      admin.plexJwtExpiresAt.getTime() <= Date.now()
    ) {
      logger.error(
        'PMS JWT probe failed: the admin JWT has expired. Have the admin sign in again (or wait for the refresh job) to renew it, then re-run.',
        { label: LABEL, expiresAt: admin.plexJwtExpiresAt ?? null }
      );
      return false;
    }

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
      return false;
    }
    if (!server.accessToken) {
      logger.error(
        'PMS JWT probe failed: plex.tv did not return an access token for this server.',
        { label: LABEL, machineId: settings.plex.machineId }
      );
      return false;
    }

    let tokenType: 'jwt' | 'legacy' = 'legacy';
    const tokenParts = server.accessToken.split('.');
    if (tokenParts.length !== 1) {
      try {
        if (
          tokenParts.length !== 3 ||
          !tokenParts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))
        ) {
          throw new Error();
        }
        const header = JSON.parse(
          Buffer.from(tokenParts[0], 'base64url').toString()
        );
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64url').toString()
        );
        if (
          !header ||
          typeof header.alg !== 'string' ||
          header.alg === 'none' ||
          !payload ||
          typeof payload !== 'object' ||
          Array.isArray(payload)
        ) {
          throw new Error();
        }
        tokenType = 'jwt';
      } catch {
        logger.error(
          'PMS JWT probe failed: plex.tv returned an unrecognized credential format.',
          { label: LABEL }
        );
        return false;
      }
    }

    const protocol = settings.plex.useSsl ? 'https' : 'http';
    const url = `${protocol}://${settings.plex.ip}:${settings.plex.port}/library/sections`;
    const control = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        'X-Plex-Client-Identifier': settings.clientId,
      },
      timeout: PROBE_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
    });
    if (control.status !== 401 && control.status !== 403) {
      logger.error(
        'PMS JWT probe inconclusive: the unauthenticated control did not return 401 or 403. Check authentication bypass settings and the server URL.',
        { label: LABEL, controlStatus: control.status, tokenType }
      );
      return false;
    }

    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        'X-Plex-Token': server.accessToken,
        'X-Plex-Client-Identifier': settings.clientId,
      },
      timeout: PROBE_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(
        tokenType === 'jwt'
          ? 'PMS JWT probe: JWT-format credential ACCEPTED by /library/sections. This does not establish JWT readiness for /watch or other PMS workflows.'
          : 'PMS JWT probe: LEGACY token ACCEPTED by /library/sections. JWT authentication to plex.tv works, but PMS JWT support remains unconfirmed.',
        { label: LABEL, pmsStatus: response.status, tokenType }
      );
    } else if (response.status === 401 || response.status === 403) {
      logger.info(
        tokenType === 'jwt'
          ? 'PMS JWT probe: JWT-format credential REJECTED by /library/sections. This server did not accept the tested JWT.'
          : 'PMS JWT probe: LEGACY token REJECTED by /library/sections. No JWT was tested.',
        { label: LABEL, pmsStatus: response.status, tokenType }
      );
    } else {
      logger.error(
        'PMS JWT probe failed: unexpected response from /library/sections.',
        { label: LABEL, pmsStatus: response.status, tokenType }
      );
      return false;
    }
    return true;
  } catch (e) {
    logger.error(
      'PMS JWT probe failed: Something went wrong while probing the Plex Media Server for JWT support.',
      {
        label: LABEL,
        errorMessage: axios.isAxiosError(e)
          ? 'HTTP request failed.'
          : 'Unexpected probe error.',
        httpStatus: axios.isAxiosError(e) ? e.response?.status : undefined,
      }
    );
    return false;
  }
};
