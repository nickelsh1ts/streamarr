import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';

export async function getAdminPlexToken(): Promise<string | null> {
  const admin = await getRepository(User).findOne({
    select: { id: true, plexToken: true },
    where: { id: 1 },
  });

  return admin?.plexToken ?? null;
}
