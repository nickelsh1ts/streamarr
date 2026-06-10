import PlexTvAPI from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import logger from '@server/logger';

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
      .addSelect('user.plexToken')
      .where("user.plexToken != ''")
      .getMany();

    for (const user of users) {
      if (!this.isRunning) {
        logger.info('Plex refresh token job cancelled.', {
          label: 'Jobs',
        });
        return;
      }
      await this.refreshUserToken(user);
    }

    this.isRunning = false;
  }

  private async refreshUserToken(user: User) {
    if (!user.plexToken) {
      logger.warn('Skipping user refresh token for user without plex token', {
        label: 'Plex Refresh Token',
        user: user.displayName,
      });
      return;
    }

    const plexTvApi = new PlexTvAPI(user.plexToken);
    plexTvApi.pingToken().catch(() => {
      // Failures are already logged inside pingToken; keep-alive pings are
      // best-effort and must not become unhandled rejections.
    });
  }
}

const refreshToken = new RefreshToken();

export default refreshToken;
