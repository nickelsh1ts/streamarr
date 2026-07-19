import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { encryptDevice, provisionJwt } from '@server/lib/plexAuth/jwt';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

/**
 * Provisions a per-user Plex JWT device after a successful legacy sign-in
 * gated behind `main.experimentalJwtAuth`.
 *
 * Designed to be called fire-and-forget from login/signup/link handlers:
 * any failure is non-fatal — the user is already signed in and their legacy
 * token covers every current consumer. Provisioning is retried at their
 * next sign-in.
 */
export const maybeProvisionPlexJwt = async (
  userId: number,
  legacyToken: string
): Promise<void> => {
  const settings = getSettings();
  if (!settings.main.experimentalJwtAuth) {
    return;
  }

  try {
    const userRepository = getRepository(User);
    const user = await userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.plexJwt',
        'user.plexJwtDevice',
        'user.plexJwtExpiresAt',
      ])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      return;
    }

    // A user with a healthy, unexpired JWT doesn't need re-provisioning.
    if (
      user.plexJwtDevice &&
      user.plexJwt &&
      user.plexJwtExpiresAt &&
      user.plexJwtExpiresAt.getTime() > Date.now()
    ) {
      return;
    }

    const { device, jwt, expiresAt } = await provisionJwt(legacyToken);

    user.plexJwtDevice = encryptDevice(device);
    user.plexJwt = jwt;
    user.plexJwtExpiresAt = expiresAt;
    await userRepository.save(user);

    logger.info('Provisioned Plex JWT device for user', {
      label: 'Plex JWT',
      userId,
      jwtExpiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    logger.warn(
      'Plex JWT provisioning failed; user continues on legacy token and will be re-provisioned at next sign-in',
      {
        label: 'Plex JWT',
        userId,
        errorMessage: e instanceof Error ? e.message : String(e),
      }
    );
  }
};
