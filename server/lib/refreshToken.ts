import PlexTvAPI from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { decryptDevice, refreshJwt } from '@server/lib/plexAuth/jwt';
import { probePmsJwtSupport } from '@server/lib/plexAuth/pmsProbe';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAxiosError } from 'axios';

/**
 * Plex credential maintenance job.
 *
 * Two responsibilities per user:
 *   1. Legacy tokens: best-effort keep-alive ping (unchanged behavior).
 *      Legacy tokens remain required for PMS access and the embedded /watch
 *      player until Plex ships PMS-side JWT validation.
 *   2. JWTs (experimental): refresh any JWT within REFRESH_THRESHOLD of
 *      expiry via the nonce exchange. The exchange also works after expiry,
 *      so a missed run is recoverable. On a terminal rejection (4xx) the
 *      JWT state is cleared — the user silently falls back to their legacy
 *      token everywhere and is re-provisioned at their next sign-in.
 */

const JWT_REFRESH_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000;

class RefreshToken {
  private isRunning = false;

  public status(): { running: boolean } {
    return { running: this.isRunning };
  }

  public cancel(): void {
    this.isRunning = false;
  }

  public async run() {
    if (this.isRunning) {
      logger.warn(
        'Refresh token job is already running, skipping duplicate run.',
        {
          label: 'Jobs',
        }
      );
      return;
    }

    this.isRunning = true;

    const userRepository = getRepository(User);

    const users = await userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.plexToken',
        'user.plexJwt',
        'user.plexJwtDevice',
        'user.plexJwtExpiresAt',
      ])
      .where("user.plexToken != ''")
      .orWhere('user.plexJwtDevice IS NOT NULL')
      .getMany();

    for (const user of users) {
      if (!this.isRunning) {
        logger.info('Plex refresh token job cancelled.', {
          label: 'Jobs',
        });
        return;
      }
      this.refreshUserLegacyToken(user);
      await this.refreshUserJwt(user);
    }

    // Once per cycle: detect the moment PMS starts validating JWTs
    await probePmsJwtSupport();

    this.isRunning = false;
  }

  private refreshUserLegacyToken(user: User) {
    if (!user.plexToken) {
      return;
    }

    const plexTvApi = new PlexTvAPI(user.plexToken);
    plexTvApi.pingToken().catch(() => {
      // Failures are already logged inside pingToken; keep-alive pings are
      // best-effort and must not become unhandled rejections.
    });
  }

  private async refreshUserJwt(user: User) {
    const settings = getSettings();
    if (!settings.main.experimentalJwtAuth || !user.plexJwtDevice) {
      return;
    }

    const expiresAtMs = user.plexJwtExpiresAt?.getTime() ?? 0;
    if (expiresAtMs - Date.now() > JWT_REFRESH_THRESHOLD_MS) {
      return;
    }

    const device = decryptDevice(user.plexJwtDevice);
    if (!device) {
      // Session secret changed or data corrupted: clear and let the next
      // sign-in re-provision. Legacy token keeps everything working.
      logger.warn(
        'Unable to decrypt Plex JWT device identity; clearing JWT state for re-provisioning',
        { label: 'Plex JWT', userId: user.id }
      );
      await this.clearJwtState(user);
      return;
    }

    try {
      const { jwt, expiresAt } = await refreshJwt(device);
      user.plexJwt = jwt;
      user.plexJwtExpiresAt = expiresAt;
      await getRepository(User).save(user);
      logger.debug('Refreshed Plex JWT for user', {
        label: 'Plex JWT',
        userId: user.id,
        jwtExpiresAt: expiresAt.toISOString(),
      });
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined;
      const terminal = !!status && status >= 400 && status < 500;

      if (terminal) {
        logger.warn(
          'Plex rejected JWT refresh; clearing JWT state for re-provisioning at next sign-in',
          {
            label: 'Plex JWT',
            userId: user.id,
            status,
          }
        );
        await this.clearJwtState(user);
      } else {
        logger.debug('Transient Plex JWT refresh failure; will retry', {
          label: 'Plex JWT',
          userId: user.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  private async clearJwtState(user: User) {
    user.plexJwt = null;
    user.plexJwtExpiresAt = null;
    user.plexJwtDevice = null;
    await getRepository(User).save(user);
  }
}

const refreshToken = new RefreshToken();

export default refreshToken;
