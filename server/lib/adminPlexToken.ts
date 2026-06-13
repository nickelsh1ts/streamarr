import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';

/**
 * Returns the admin's LEGACY Plex token. This is the credential for
 * PMS-bound calls (PlexAPI: scanner, health check, image proxy) and the
 * /watch token injection — PMS does not validate JWTs yet. For plex.tv
 * calls, prefer `getAdminPlexTvCredential()` from plexAuth/credentials.
 */
export async function getAdminPlexToken(): Promise<string | null> {
  const admin = await getRepository(User).findOne({
    select: { id: true, plexToken: true },
    where: { id: 1 },
  });

  return admin?.plexToken ?? null;
}
