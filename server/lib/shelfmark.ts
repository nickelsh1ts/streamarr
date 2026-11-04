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
export class ShelfmarkProvisioningError extends Error {}
export class ShelfmarkUserNotFoundError extends Error {}
export class ShelfmarkPersistenceError extends Error {}

const accountChangeQueues = new Map<string, Promise<void>>();

async function withAccountChangeLock<T>(
  key: string,
  action: () => Promise<T>
): Promise<T> {
  const previous = accountChangeQueues.get(key);
  let release: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  accountChangeQueues.set(key, pending);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (accountChangeQueues.get(key) === pending) {
      accountChangeQueues.delete(key);
    }
  }
}

export async function withShelfmarkAccountLock<T>(
  user: User,
  action: (currentUser: User) => Promise<T>
): Promise<T> {
  return withAccountChangeLock(`user:${user.id}`, async () => {
    let currentUser: User;
    try {
      currentUser = await getRepository(User).findOneBy({ id: user.id });
    } catch (e) {
      logger.error('Failed to reload Streamarr user for Shelfmark linking', {
        label: 'Shelfmark',
        userId: user.id,
        message: e instanceof Error ? e.message : String(e),
      });
      throw new ShelfmarkPersistenceError(
        'Failed to reload the Streamarr user for Shelfmark linking.'
      );
    }
    if (!currentUser) {
      throw new ShelfmarkUserNotFoundError('Streamarr user no longer exists.');
    }

    const username =
      currentUser.shelfmarkUsername ??
      getAudiobookshelfUsernameCandidate(currentUser);
    const identityKey = `identity:${ShelfmarkAPI.buildUrl(getSettings().shelfmark)}:${username.toLocaleLowerCase()}`;
    return withAccountChangeLock(identityKey, () => action(currentUser));
  });
}

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
  options: LinkShelfmarkAccountOptions
): Promise<string> {
  return withShelfmarkAccountLock(user, (currentUser) =>
    provisionShelfmarkAccount(currentUser, options)
  );
}

async function provisionShelfmarkAccount(
  user: User,
  { allowCreation, allowExistingAccountLink }: LinkShelfmarkAccountOptions
): Promise<string> {
  const settings = { ...getSettings().shelfmark };
  const adminApi = getShelfmarkAPI(settings);
  const userRepository = getRepository(User);
  const userDefaults = settings.defaultUserSettings;
  const defaults = {
    ...(userDefaults?.ebookPolicy !== undefined
      ? {
          REQUEST_POLICY_DEFAULT_EBOOK: userDefaults.ebookPolicy,
        }
      : {}),
    ...(userDefaults?.audiobookPolicy !== undefined
      ? {
          REQUEST_POLICY_DEFAULT_AUDIOBOOK: userDefaults.audiobookPolicy,
        }
      : {}),
  };
  const username = getAudiobookshelfUsernameCandidate(user).toLocaleLowerCase();
  let shelfmarkUser = (await adminApi.getAllUsers()).find(
    (candidate) =>
      candidate.username.toLocaleLowerCase() ===
      (user.shelfmarkUsername ?? username).toLocaleLowerCase()
  );
  let shelfmarkUserId: number | undefined;
  let creationStarted = false;

  try {
    if (!shelfmarkUser) {
      if (!allowCreation) {
        throw new ShelfmarkAccountCreationDisabledError();
      }

      creationStarted = true;
      const authStatus = await getShelfmarkAPI(settings, {
        username,
        isAdmin: user.hasPermission(Permission.ADMIN),
      }).getAuthStatus();
      if (!authStatus.authenticated) {
        throw new Error('Shelfmark did not authenticate the provisioned user.');
      }
      shelfmarkUser = (await adminApi.getAllUsers()).find(
        (candidate) =>
          candidate.username.toLocaleLowerCase() ===
          username.toLocaleLowerCase()
      );
      if (!shelfmarkUser) {
        throw new Error('Shelfmark did not create the provisioned user.');
      }
      shelfmarkUserId = shelfmarkUser.id;
    } else if (
      !user.shelfmarkUsername &&
      !allowExistingAccountLink &&
      shelfmarkUser.email?.toLocaleLowerCase() !==
        user.email.toLocaleLowerCase()
    ) {
      throw new ShelfmarkAccountLinkRequiresManagerError();
    }

    const linkedUsername = shelfmarkUser.username;
    if (!allowExistingAccountLink) {
      let conflictingUsers: User[];
      try {
        conflictingUsers = await userRepository
          .createQueryBuilder('user')
          .where('LOWER(user.shelfmarkUsername) = LOWER(:username)', {
            username: linkedUsername,
          })
          .andWhere('user.id != :id', { id: user.id })
          .getMany();
      } catch (e) {
        logger.error('Failed to check Shelfmark links in Streamarr', {
          label: 'Shelfmark',
          userId: user.id,
          message: e instanceof Error ? e.message : String(e),
        });
        throw new ShelfmarkPersistenceError(
          'Failed to check existing Shelfmark account links in Streamarr.'
        );
      }

      if (conflictingUsers.length > 0) {
        throw new ShelfmarkUsernameConflictError();
      }
    }

    await adminApi.updateUser(shelfmarkUser.id, {
      email: user.email,
      display_name: user.displayName,
      ...(shelfmarkUserId !== undefined && Object.keys(defaults).length > 0
        ? { settings: defaults }
        : {}),
    });

    try {
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
    } catch (e) {
      if (
        e instanceof ShelfmarkUsernameConflictError ||
        isShelfmarkUniqueConstraintError(e)
      ) {
        throw e;
      }
      logger.error('Failed to save Shelfmark account link in Streamarr', {
        label: 'Shelfmark',
        userId: user.id,
        username: linkedUsername,
        message: e instanceof Error ? e.message : String(e),
      });
      throw new ShelfmarkPersistenceError(
        'Failed to save the Shelfmark account link in Streamarr.'
      );
    }
    invalidateShelfmarkAccountCache(user.id);

    return linkedUsername;
  } catch (e) {
    if (
      !creationStarted ||
      e instanceof ShelfmarkPersistenceError ||
      e instanceof ShelfmarkUserNotFoundError ||
      e instanceof ShelfmarkUsernameConflictError ||
      isShelfmarkUniqueConstraintError(e)
    ) {
      throw e;
    }
    invalidateShelfmarkAccountCache(user.id);
    logger.error('Shelfmark account provisioning failed', {
      label: 'Shelfmark',
      userId: user.id,
      username,
      accountFoundAfterAuth: shelfmarkUserId !== undefined,
      shelfmarkUserId,
      message: e instanceof Error ? e.message : String(e),
    });
    if (shelfmarkUserId === undefined) {
      throw new ShelfmarkProvisioningError(
        'Shelfmark account setup could not be confirmed.'
      );
    }
    throw new ShelfmarkProvisioningError(
      'Shelfmark setup failed. An account may exist but is not linked to Streamarr.'
    );
  }
}
