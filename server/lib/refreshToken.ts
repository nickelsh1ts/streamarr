import PlexTvAPI from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { decryptDevice, refreshJwt } from '@server/lib/plexAuth/jwt';
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

type JwtRefreshSuccess = {
  userId: number;
  jwtExpiresAt: string;
};

type JwtRefreshFailure = {
  userId: number;
  reason: 'device_decryption' | 'rejected' | 'transient';
  terminal: boolean;
  status?: number;
  errorMessage?: string;
};

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

    let userPingFailed: { userId: number; errorMessage: string }[] = [];
    const jwtRefreshSucceeded: JwtRefreshSuccess[] = [];
    const jwtRefreshFailed: JwtRefreshFailure[] = [];

    for (const user of users) {
      if (!this.isRunning) {
        logger.info('Plex refresh token job cancelled.', {
          label: 'Jobs',
        });
        return;
      }
      await this.refreshUserLegacyToken(user).catch((e) => {
        userPingFailed.push({
          userId: user.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      });
      await this.refreshUserJwt(user, jwtRefreshSucceeded, jwtRefreshFailed);
    }

    if (userPingFailed.length > 0) {
      logger.error('Failed to ping tokens', {
        label: 'Plex Refresh Token',
        failureCount: userPingFailed.length,
        failures: userPingFailed,
      });
    }

    if (jwtRefreshSucceeded.length > 0) {
      logger.debug('Refreshed Plex JWTs', {
        label: 'Plex JWT',
        successCount: jwtRefreshSucceeded.length,
        successes: jwtRefreshSucceeded,
      });
    }

    if (jwtRefreshFailed.length > 0) {
      const failureSummary = {
        label: 'Plex JWT',
        failureCount: jwtRefreshFailed.length,
        failures: jwtRefreshFailed,
      };
      if (jwtRefreshFailed.some((failure) => failure.terminal)) {
        logger.warn('Failed to refresh Plex JWTs', failureSummary);
      } else {
        logger.debug('Failed to refresh Plex JWTs', failureSummary);
      }
    }

    this.isRunning = false;
  }

  private async refreshUserLegacyToken(user: User) {
    if (!user.plexToken) {
      return;
    }

    const plexTvApi = new PlexTvAPI(user.plexToken);
    await plexTvApi.pingToken();
  }

  private async refreshUserJwt(
    user: User,
    successes: JwtRefreshSuccess[],
    failures: JwtRefreshFailure[]
  ) {
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
      failures.push({
        userId: user.id,
        reason: 'device_decryption',
        terminal: true,
      });
      await this.clearJwtState(user);
      return;
    }

    try {
      const { jwt, expiresAt } = await refreshJwt(device);
      user.plexJwt = jwt;
      user.plexJwtExpiresAt = expiresAt;
      await getRepository(User).save(user);
      successes.push({
        userId: user.id,
        jwtExpiresAt: expiresAt.toISOString(),
      });
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined;
      const terminal = !!status && status >= 400 && status < 500;

      if (terminal) {
        failures.push({
          userId: user.id,
          reason: 'rejected',
          terminal: true,
          status,
        });
        await this.clearJwtState(user);
      } else {
        failures.push({
          userId: user.id,
          reason: 'transient',
          terminal: false,
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
