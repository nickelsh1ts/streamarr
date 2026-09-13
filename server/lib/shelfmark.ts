import ShelfmarkAPI from '@server/api/shelfmark';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getAudiobookshelfUsernameCandidate } from '@server/lib/audiobookshelf';
import { Permission } from '@server/lib/permissions';
import type { ShelfmarkSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';

interface ShelfmarkIdentity {
  username: string;
  isAdmin: boolean;
}

export function getShelfmarkAPI(
  settings: ShelfmarkSettings,
  identity?: ShelfmarkIdentity
): ShelfmarkAPI {
  return new ShelfmarkAPI(
    ShelfmarkAPI.buildUrl(settings),
    {},
    {
      headers: {
        'X-Auth-User': identity?.username ?? 'streamarr-internal',
        'X-Auth-Groups': identity?.isAdmin === false ? '' : 'streamarr-admin',
      },
      timeout: getSettings().network.requestTimeout,
    }
  );
}

export class ShelfmarkAccountCreationDisabledError extends Error {}
export class ShelfmarkAccountLinkRequiresManagerError extends Error {}

interface LinkShelfmarkAccountOptions {
  allowCreation: boolean;
  allowExistingAccountLink: boolean;
}

export async function linkShelfmarkAccount(
  user: User,
  { allowCreation, allowExistingAccountLink }: LinkShelfmarkAccountOptions
): Promise<string> {
  const settings = getSettings().shelfmark;
  const adminApi = getShelfmarkAPI(settings);
  const username = getAudiobookshelfUsernameCandidate(user).toLocaleLowerCase();
  let shelfmarkUser = (await adminApi.getAllUsers()).find(
    (candidate) =>
      candidate.username.toLocaleLowerCase() ===
      (user.shelfmarkUsername ?? username).toLocaleLowerCase()
  );

  if (!shelfmarkUser) {
    if (!allowCreation) {
      throw new ShelfmarkAccountCreationDisabledError();
    }

    const authStatus = await getShelfmarkAPI(settings, {
      username,
      isAdmin: user.hasPermission(Permission.ADMIN),
    }).getAuthStatus();
    if (!authStatus.authenticated) {
      throw new Error('Shelfmark did not authenticate the provisioned user.');
    }
    shelfmarkUser = (await adminApi.getAllUsers()).find(
      (candidate) =>
        candidate.username.toLocaleLowerCase() === username.toLocaleLowerCase()
    );
    if (!shelfmarkUser) {
      throw new Error('Shelfmark did not create the provisioned user.');
    }
  } else if (
    !user.shelfmarkUsername &&
    !allowExistingAccountLink &&
    shelfmarkUser.email?.toLocaleLowerCase() !== user.email.toLocaleLowerCase()
  ) {
    throw new ShelfmarkAccountLinkRequiresManagerError();
  }

  await adminApi.updateUser(shelfmarkUser.id, {
    email: user.email,
    display_name: user.displayName,
  });
  user.shelfmarkUsername = shelfmarkUser.username;
  await getRepository(User).save(user);

  return shelfmarkUser.username;
}
