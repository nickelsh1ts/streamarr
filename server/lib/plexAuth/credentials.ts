import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';

/**
 * Credential selection for plex.tv API calls.
 *
 * When `main.experimentalJwtAuth` is enabled and the user holds a fresh JWT,
 * plex.tv calls prefer it; otherwise they fall back to the legacy token.
 * Falling back is always safe — every plex.tv endpoint streamarr uses
 * accepts both credential types.
 *
 * SCOPE: plex.tv ONLY. PMS does not validate JWTs yet, so everything that
 * talks to the media server itself (PlexAPI consumers: scanner, health
 * check, image proxy) and the /watch token injection MUST continue to use
 * the legacy token. Do not route those through these helpers.
 */

const JWT_FRESHNESS_MARGIN_MS = 60 * 1000;

type CredentialFields = Pick<
  User,
  'plexToken' | 'plexJwt' | 'plexJwtExpiresAt'
>;

/**
 * Returns the preferred plex.tv credential for an already-loaded user.
 * If the user object was loaded without the JWT fields selected (they are
 * `select: false`), this transparently degrades to the legacy token.
 */
export const preferPlexJwt = (
  user: Partial<CredentialFields> | null | undefined
): string | null => {
  if (!user) {
    return null;
  }

  const settings = getSettings();
  if (
    settings.main.experimentalJwtAuth &&
    user.plexJwt &&
    user.plexJwtExpiresAt &&
    user.plexJwtExpiresAt.getTime() > Date.now() + JWT_FRESHNESS_MARGIN_MS
  ) {
    return user.plexJwt;
  }

  return user.plexToken ?? null;
};

/**
 * Loads the admin user and returns the preferred plex.tv credential.
 * For PMS-bound calls use `getAdminPlexToken()` instead.
 */
export const getAdminPlexTvCredential = async (): Promise<string | null> => {
  const admin = await getRepository(User)
    .createQueryBuilder('user')
    .addSelect(['user.plexToken', 'user.plexJwt', 'user.plexJwtExpiresAt'])
    .where('user.id = :id', { id: 1 })
    .getOne();

  return preferPlexJwt(admin);
};
