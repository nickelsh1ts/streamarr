import ShelfmarkAPI from '@server/api/shelfmark';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getAudiobookshelfUsernameCandidate } from '@server/lib/audiobookshelf';
import { Permission } from '@server/lib/permissions';
import type { ShelfmarkSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

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
export class ShelfmarkUsernameConflictError extends Error {}

// Avoids a Shelfmark user-list request for every proxied asset.
const EXISTING_ACCOUNT_CACHE_TTL_MS = 60_000;
const existingAccountCache = new Map<
  string,
  { expiresAt: number; promise: Promise<boolean> }
>();

const getShelfmarkAccountCacheKey = (
  user: User,
  settings: ShelfmarkSettings
): string =>
  `${user.id}:${settings.useSsl}:${settings.hostname}:${settings.port}:${settings.urlBase}`;

export function invalidateShelfmarkAccountCache(userId: number): void {
  for (const key of existingAccountCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      existingAccountCache.delete(key);
    }
  }
}

export function isShelfmarkUniqueConstraintError(e: unknown): boolean {
  return e instanceof Error && /unique constraint/i.test(e.message);
}

export async function hasVerifiedShelfmarkAccount(
  user: User,
  settings: ShelfmarkSettings
): Promise<boolean> {
  if (!user.shelfmarkUsername) {
    return false;
  }

  const now = Date.now();
  for (const [key, entry] of existingAccountCache) {
    if (entry.expiresAt <= now) {
      existingAccountCache.delete(key);
    }
  }

  const cacheKey = getShelfmarkAccountCacheKey(user, settings);
  const cached = existingAccountCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = getShelfmarkAPI(settings)
    .getAllUsers()
    .then((users) =>
      users.some(
        (candidate) =>
          candidate.username.toLocaleLowerCase() ===
          user.shelfmarkUsername?.toLocaleLowerCase()
      )
    );
  existingAccountCache.set(cacheKey, {
    expiresAt: now + EXISTING_ACCOUNT_CACHE_TTL_MS,
    promise,
  });
  promise.catch(() => {
    if (existingAccountCache.get(cacheKey)?.promise === promise) {
      existingAccountCache.delete(cacheKey);
    }
  });
  return promise;
}

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

  const linkedUsername = shelfmarkUser.username;
  const userRepository = getRepository(User);
  if (!allowExistingAccountLink) {
    const conflictingUsers = await userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.shelfmarkUsername) = LOWER(:username)', {
        username: linkedUsername,
      })
      .andWhere('user.id != :id', { id: user.id })
      .getMany();

    if (conflictingUsers.length > 0) {
      throw new ShelfmarkUsernameConflictError();
    }
  }

  await adminApi.updateUser(shelfmarkUser.id, {
    email: user.email,
    display_name: user.displayName,
  });

  await userRepository.manager.transaction(async (manager) => {
    const transactionalRepo = manager.getRepository(User);

    const conflictingUsers = await transactionalRepo
      .createQueryBuilder('user')
      .where('LOWER(user.shelfmarkUsername) = LOWER(:username)', {
        username: linkedUsername,
      })
      .andWhere('user.id != :id', { id: user.id })
      .getMany();

    if (conflictingUsers.length > 0) {
      if (!allowExistingAccountLink) {
        throw new ShelfmarkUsernameConflictError();
      }
      for (const conflictingUser of conflictingUsers) {
        conflictingUser.shelfmarkUsername = null;
        await transactionalRepo.save(conflictingUser);
        invalidateShelfmarkAccountCache(conflictingUser.id);
        logger.warn('Reassigned Shelfmark username between users', {
          label: 'Shelfmark',
          username: linkedUsername,
          fromUserId: conflictingUser.id,
          toUserId: user.id,
        });
      }
    }

    user.shelfmarkUsername = linkedUsername;
    await transactionalRepo.save(user);
  });
  invalidateShelfmarkAccountCache(user.id);

  return linkedUsername;
}
