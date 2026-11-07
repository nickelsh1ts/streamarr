import PlexTvAPI, {
  extractPlexError,
  type UsersResponse,
} from '@server/api/plextv';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import type {
  PlexSharedSection,
  PlexUserIdentity,
} from '@server/interfaces/api/plexInterfaces';
import { handlePlexAccessLost } from '@server/lib/plexAccessLost';
import {
  getAdminPlexTvCredential,
  preferPlexJwt,
} from '@server/lib/plexAuth/credentials';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import AsyncLock from '@server/utils/asyncLock';
import {
  isDefaultSentinel,
  resolveSharedLibraryKeys,
  shareLibraryKeys,
  sharedLibrariesFromShare,
} from '@server/utils/sharedLibraries';

const LABEL = 'Plex Sync';
const AUTO_ACCEPT_ATTEMPTS = 5;
const AUTO_ACCEPT_DELAY_MS = 3_000;
const BULK_SYNC_CONCURRENCY = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PERMISSION_KEYS = [
  'allowSync',
  'allowCameraUpload',
  'allowChannels',
] as const;

/** Admin API and users list fetched once and reused across a batch. */
export interface PlexBatch {
  api: PlexTvAPI;
  users: UsersResponse;
}

export class PlexUserNotFoundError extends Error {
  constructor() {
    super('User not found in Plex shared users list.');
    this.name = 'PlexUserNotFoundError';
  }
}

export class NoSharedLibrariesError extends Error {
  constructor() {
    super('Shared libraries resolve to no enabled libraries.');
    this.name = 'NoSharedLibrariesError';
  }
}

export interface PlexSyncOptions {
  /** undefined leaves the current Plex value unchanged */
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
}

export interface PlexInviteOptions {
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
  /** Invite to the owner's Plex Home instead of a regular share */
  plexHome?: boolean;
  userTokenOverride?: string;
}

export interface PlexBulkSyncSummary {
  synced: number;
  failed: number;
  removed: number;
}

/**
 * PlexSync orchestrates user library/share synchronization between
 * Streamarr and plex.tv via PlexTvAPI.
 */
class PlexSync {
  private settings = getSettings();
  private lock = new AsyncLock();
  // Users whose last library sync failed; retried by the next reconcile
  private pendingSync = new Set<number>();

  private async getAdminApi(): Promise<PlexTvAPI> {
    const credential = await getAdminPlexTvCredential();
    if (!credential) {
      throw new Error('Admin Plex credential is missing');
    }
    return new PlexTvAPI(credential);
  }

  private getIdentity(user: User): PlexUserIdentity {
    return {
      plexId: user.plexId,
      email: user.email,
      username: user.plexUsername,
    };
  }

  private assertHasIdentity(user: User): void {
    if (!user.email && user.plexId == null && !user.plexUsername) {
      throw new Error(`User ${user.id} has no Plex identifiers for Plex sync`);
    }
  }

  private enabledLibraries() {
    return this.settings.plex.libraries.filter((library) => library.enabled);
  }

  /** Enabled library keys a stored sharedLibraries value grants right now. */
  public resolveLibraryKeys(value: string | null | undefined): string[] {
    return resolveSharedLibraryKeys({
      value,
      adminDefault: this.settings.main.sharedLibraries,
      enabledLibraries: this.enabledLibraries(),
    });
  }

  private libraryKeysFor(value: string | null | undefined): string[] {
    const keys = this.resolveLibraryKeys(value);
    // An empty section list would share every library on Plex
    if (keys.length === 0) {
      throw new NoSharedLibrariesError();
    }
    return keys;
  }

  /**
   * Maps server-local library keys to the global section ids plex.tv needs,
   * using already known sections (e.g. from a share) before fetching.
   */
  private async mapKeysToSectionIds(
    api: PlexTvAPI,
    machineId: string,
    libraryKeys: string[],
    knownSections: Pick<PlexSharedSection, 'key' | 'id'>[] = []
  ): Promise<number[]> {
    const idsByKey = new Map(
      knownSections.map((section) => [section.key, section.id])
    );
    if (libraryKeys.some((key) => !idsByKey.has(key))) {
      for (const section of await api.getServerSections(machineId)) {
        idsByKey.set(section.key, section.id);
      }
    }
    return libraryKeys.map((key) => {
      const sectionId = idsByKey.get(key);
      if (sectionId === undefined) {
        throw new Error(`Invalid library section ID: ${key}`);
      }
      return sectionId;
    });
  }

  /**
   * Gets the user's current library access on the Plex server.
   * `existsInPlex` is false when the user is definitively absent from the
   * server's shared users list (transport errors still throw).
   */
  public async getCurrentPlexLibraries(user: User): Promise<{
    existsInPlex: boolean;
    libraries: string[] | 'all';
    permissions?: {
      allowSync: boolean;
      allowCameraUpload: boolean;
      allowChannels: boolean;
    };
  }> {
    this.assertHasIdentity(user);
    const api = await this.getAdminApi();
    const share = await api.getUserShare(
      this.getIdentity(user),
      this.settings.plex.machineId
    );

    if (!share) {
      return { existsInPlex: false, libraries: [] };
    }

    return {
      existsInPlex: true,
      libraries: shareLibraryKeys(share),
      permissions: {
        allowSync: share.allowSync,
        allowCameraUpload: share.allowCameraUpload,
        allowChannels: share.allowChannels,
      },
    };
  }

  /**
   * Reconciles a user's Plex share with the libraries they are granted (see
   * libraryKeysFor), skipping the update when nothing differs. Resolution
   * failures throw and leave the existing share untouched. Permissions are
   * tri-state: only explicitly provided values can trigger the share
   * recreation that updates them.
   */
  public async syncUserLibraries(
    user: User,
    options: PlexSyncOptions = {},
    batch?: PlexBatch
  ): Promise<void> {
    this.assertHasIdentity(user);

    await this.lock.dispatch(`plex-share-${user.id}`, async () => {
      try {
        const machineId = this.settings.plex.machineId;
        const api = batch?.api ?? (await this.getAdminApi());
        // Queued work must not replay a stale in-memory assignment
        const stored = await getRepository(UserSettings).findOne({
          where: { user: { id: user.id } },
        });
        const libraryKeys = this.libraryKeysFor(
          (stored ?? user.settings)?.sharedLibraries
        );

        const identity = this.getIdentity(user);
        const share =
          (await api.getUserShare(identity, machineId, batch?.users)) ??
          // The batch list may predate a re-invite
          (batch ? await api.getUserShare(identity, machineId) : null);
        if (!share) {
          throw new PlexUserNotFoundError();
        }

        const sharedKeys = shareLibraryKeys(share);
        const unchanged =
          sharedKeys !== 'all' &&
          sharedKeys.length === libraryKeys.length &&
          libraryKeys.every((key) => sharedKeys.includes(key)) &&
          PERMISSION_KEYS.every(
            (key) => options[key] === undefined || options[key] === share[key]
          );
        if (unchanged) {
          return;
        }

        await api.updateUserShare({
          machineId,
          share,
          sectionIds: await this.mapKeysToSectionIds(
            api,
            machineId,
            libraryKeys,
            share.sections
          ),
          permissions: {
            allowSync: options.allowSync,
            allowCameraUpload: options.allowCameraUpload,
            allowChannels: options.allowChannels,
          },
        });
      } catch (e) {
        const message = extractPlexError(e);
        logger.error(`Failed to sync Plex libraries for user ${user.email}`, {
          label: LABEL,
          userId: user.id,
          error: message,
        });
        if (
          e instanceof PlexUserNotFoundError ||
          e instanceof NoSharedLibrariesError
        ) {
          throw e;
        }
        throw new Error(`Plex sync error: ${message}`);
      }
    });
  }

  /** Runs share changes made outside plexSync exclusively with the user's syncs. */
  public async withUserLock(
    user: User,
    callback: () => Promise<void>
  ): Promise<void> {
    await this.lock.dispatch(`plex-share-${user.id}`, callback);
  }

  /**
   * Invites a user to the Plex server (or the owner's Plex Home), trying
   * their email first and Plex username second. Returns as soon as the
   * invite succeeds with either identifier; only fails if both attempts fail.
   */
  public async inviteUser(
    user: User,
    options: PlexInviteOptions
  ): Promise<void> {
    const machineId = this.settings.plex.machineId;
    const api = await this.getAdminApi();

    const identifiers = [user.email, user.plexUsername].filter(
      (identifier): identifier is string => !!identifier
    );
    if (identifiers.length === 0) {
      throw new Error(
        `User ${user.id} has no email or Plex username to invite`
      );
    }

    const sectionIds = await this.mapKeysToSectionIds(
      api,
      machineId,
      this.libraryKeysFor(user.settings?.sharedLibraries)
    );

    let lastError: unknown;
    let invited = false;

    for (const identifier of identifiers) {
      try {
        const payload = {
          identifier,
          machineId,
          sectionIds,
          allowSync: options.allowSync ?? false,
          allowCameraUpload: options.allowCameraUpload ?? false,
          allowChannels: options.allowChannels ?? false,
        };

        if (options.plexHome) {
          const { existingFriend } = await api.inviteHomeUser(payload);
          if (existingFriend) {
            // The Home invite leaves an existing friend's share as-is
            const share = await api.getUserShare(
              this.getIdentity(user),
              machineId
            );
            if (share) {
              await api.updateUserShare({
                machineId,
                share,
                sectionIds,
                permissions: {
                  allowSync: payload.allowSync,
                  allowCameraUpload: payload.allowCameraUpload,
                  allowChannels: payload.allowChannels,
                },
              });
            } else {
              await api.inviteUserToServer(payload);
            }
          }
        } else {
          await api.inviteUserToServer(payload);
        }

        invited = true;
        break;
      } catch (e) {
        lastError = e;
        logger.warn(`Plex invite attempt failed for ${identifier}`, {
          label: LABEL,
          userId: user.id,
          errorMessage: extractPlexError(e),
        });
      }
    }

    if (!invited) {
      throw new Error(extractPlexError(lastError));
    }

    this.scheduleAutoAccept(user, {
      userTokenOverride: options.userTokenOverride,
    });
  }

  /**
   * Syncs many users' shares a few at a time to avoid hammering plex.tv.
   * Users missing from Plex, or left with no enabled libraries, lose access
   * and are deactivated.
   */
  public async syncUsers(
    users: User[],
    options: PlexSyncOptions = {}
  ): Promise<PlexBulkSyncSummary> {
    const summary = { synced: 0, failed: 0, removed: 0 };
    const queue = users.filter(
      (user) => user.userType === UserType.PLEX && user.active && user.email
    );
    if (queue.length === 0) {
      return summary;
    }

    let batch: PlexBatch;
    try {
      const api = await this.getAdminApi();
      batch = { api, users: await api.getUsers() };
    } catch (e) {
      logger.error('Failed to start Plex sync', {
        label: LABEL,
        error: extractPlexError(e),
      });
      queue.forEach((user) => this.pendingSync.add(user.id));
      return { ...summary, failed: queue.length };
    }
    const { api } = batch;

    await Promise.all(
      Array.from(
        { length: Math.min(BULK_SYNC_CONCURRENCY, queue.length) },
        async () => {
          let user: User | undefined;
          while ((user = queue.shift())) {
            try {
              await this.syncUserLibraries(user, options, batch);
              summary.synced++;
              this.pendingSync.delete(user.id);
            } catch (e) {
              // syncUserLibraries already logged the failure
              if (
                !(e instanceof PlexUserNotFoundError) &&
                !(e instanceof NoSharedLibrariesError)
              ) {
                summary.failed++;
                this.pendingSync.add(user.id);
                continue;
              }
              try {
                const machineId = this.settings.plex.machineId;
                const identity = this.getIdentity(user);
                let restored = false;
                // Decide under the user's lock so a re-invite can't interleave
                await this.withUserLock(user, async () => {
                  if (e instanceof PlexUserNotFoundError) {
                    restored = !!(await api.getUserShare(identity, machineId));
                  } else {
                    // A save in between already synced any new assignment
                    const stored = await getRepository(UserSettings).findOne({
                      where: { user: { id: user.id } },
                    });
                    restored =
                      this.resolveLibraryKeys(stored?.sharedLibraries).length >
                      0;
                    if (!restored) {
                      const plexId =
                        user.plexId ??
                        (await api.getUserShare(identity, machineId))
                          ?.accountId;
                      if (plexId) {
                        await api.deprovisionUser(plexId, machineId);
                      }
                    }
                  }
                  if (!restored) {
                    await handlePlexAccessLost(user);
                  }
                });
                if (restored) {
                  summary.synced++;
                } else {
                  summary.removed++;
                }
                this.pendingSync.delete(user.id);
              } catch (e) {
                summary.failed++;
                this.pendingSync.add(user.id);
                logger.error('Failed to remove Plex access for user', {
                  label: LABEL,
                  userId: user.id,
                  error: extractPlexError(e),
                });
              }
            }
          }
        }
      )
    );

    return summary;
  }

  /**
   * Applies a library settings change and reconciles the users it affects as
   * one step, so concurrent changes can't interleave with a running sync.
   * `apply` returns which stored values are affected, or null when nothing
   * changed. Users whose last sync failed are retried either way. Errors
   * from `apply` propagate; sync errors return 'failed'.
   */
  public async applyAndReconcile(
    apply: () => ((value: string | null | undefined) => boolean) | null
  ): Promise<PlexBulkSyncSummary | 'failed' | undefined> {
    let result: PlexBulkSyncSummary | 'failed' | undefined;
    await this.lock.dispatch('plex-reconcile', async () => {
      const affects = apply();
      if (!affects && this.pendingSync.size === 0) {
        return;
      }
      // Failures are re-added by syncUsers; inactive or deleted users drop out
      const pending = new Set(this.pendingSync);
      this.pendingSync.clear();
      try {
        const users = (
          await getRepository(User)
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.settings', 'settings')
            .where('user.id != 1')
            .getMany()
        ).filter(
          (user) =>
            pending.has(user.id) || !!affects?.(user.settings?.sharedLibraries)
        );
        result = await this.syncUsers(users);
        logger.info(
          affects
            ? 'Reconciled Plex shares after library settings change'
            : 'Retried pending Plex library syncs',
          { label: LABEL, ...result }
        );
      } catch (e) {
        pending.forEach((id) => this.pendingSync.add(id));
        logger.error('Failed to reconcile Plex shares', {
          label: LABEL,
          error: extractPlexError(e),
        });
        result = 'failed';
      }
    });
    return result;
  }

  /** Retries users whose last library sync failed. */
  public async retryPendingSync(): Promise<void> {
    await this.applyAndReconcile(() => null);
  }

  /**
   * Adopts a newly created Plex user's existing share as their assigned
   * access, so Streamarr reflects what Plex already grants. A share matching
   * the server default leaves the user following the default.
   */
  public async adoptPlexAccess(user: User, batch?: PlexBatch): Promise<void> {
    const settings =
      user.settings ??
      (await getRepository(UserSettings).findOne({
        where: { user: { id: user.id } },
      })) ??
      new UserSettings({ user });
    if (!isDefaultSentinel(settings.sharedLibraries)) {
      return;
    }

    const api = batch?.api ?? (await this.getAdminApi());
    const share = await api.getUserShare(
      this.getIdentity(user),
      this.settings.plex.machineId,
      batch?.users
    );
    if (!share) {
      return;
    }

    settings.sharedLibraries = sharedLibrariesFromShare(share, {
      adminDefault: this.settings.main.sharedLibraries,
      enabledLibraries: this.enabledLibraries(),
    });
    settings.allowDownloads = share.allowSync;
    await getRepository(UserSettings).save(settings);
    logger.debug('Adopted existing Plex access for user', {
      label: LABEL,
      userId: user.id,
      sharedLibraries: settings.sharedLibraries ?? 'default',
    });
  }

  public scheduleAutoAccept(
    user: User,
    options: { userTokenOverride?: string } = {}
  ): void {
    const settings = getSettings();
    const serverName = settings.plex.name || undefined;
    const userToken = options.userTokenOverride || preferPlexJwt(user);

    if (userToken) {
      logger.info('Attempting background auto-accept of Plex invite', {
        label: LABEL,
        userId: user.id,
        tokenSource: options.userTokenOverride ? 'override' : 'user',
      });
      void this.runAutoAccept({
        userToken,
        serverName,
        userId: user.id,
        identity: this.getIdentity(user),
      }).catch((e) => {
        logger.error('Unable to auto-accept invite', {
          label: LABEL,
          userId: user.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      });
    } else {
      // Plex auto-accepts re-shares for previously connected accounts, so
      // check the admin-side share before assuming a manual accept is needed.
      void (async () => {
        await sleep(AUTO_ACCEPT_DELAY_MS);
        if (
          (await this.isShareAccepted(this.getIdentity(user), user.id)) ===
          false
        ) {
          logger.warn(
            'No user token is available — auto-accept skipped, the user must accept the invite manually',
            { label: LABEL, userId: user.id }
          );
        }
      })().catch((e) => {
        logger.error('Unable to verify Plex invite acceptance', {
          label: LABEL,
          userId: user.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      });
    }
  }

  /**
   * Polls the invitee's pending invites and accepts the matching one.
   * Covers regular shares and Plex Home invites alike
   * Match priority: server friendly name → home invite → any server-share invite.
   */
  private async runAutoAccept({
    userToken,
    serverName,
    userId,
    identity,
  }: {
    userToken: string;
    serverName?: string;
    userId: number;
    identity: PlexUserIdentity;
  }): Promise<void> {
    const userApi = new PlexTvAPI(userToken);

    for (let attempt = 0; attempt < AUTO_ACCEPT_ATTEMPTS; attempt++) {
      // Plex can take a few seconds to propagate a new invite to the
      // receiver's account, so wait before every check.
      await sleep(AUTO_ACCEPT_DELAY_MS);

      const invites = await userApi.getPendingReceivedInvites();
      const match =
        (serverName
          ? invites.find((invite) => invite.serverNames.includes(serverName))
          : undefined) ??
        invites.find((invite) => invite.home) ??
        invites.find((invite) => invite.server);

      if (match) {
        await userApi.acceptInvite(match);

        // Verify the accept actually took: a zero-scope or rejected accept
        // leaves the invite pending, which would otherwise fail silently.
        const remaining = await userApi.getPendingReceivedInvites();
        if (remaining.some((invite) => invite.id === match.id)) {
          logger.error(
            'Something went wrong accepting the invite. It is still pending after acceptance attempt',
            {
              label: LABEL,
              userId,
              inviteId: match.id,
              flags: {
                friend: match.friend,
                home: match.home,
                server: match.server,
              },
            }
          );
          continue;
        }

        logger.info('Plex invite automatically accepted', {
          label: LABEL,
          userId,
          inviteId: match.id,
          home: match.home,
        });
        return;
      }

      // No pending invite found. When a friendship already exists from a
      // previous share, Plex grants access instantly without creating a
      // pending invite — check the admin-side share and exit quietly if
      // it's already accepted.
      if (await this.isShareAccepted(identity, userId)) {
        logger.info('Plex invite already accepted', {
          label: LABEL,
          userId,
        });
        return;
      }
    }

    logger.error('Auto-accept failed: invite could not be found', {
      label: LABEL,
      userId,
    });
  }

  /**
   * Returns true when the admin-side share for this user is already accepted
   * (Plex auto-accepts re-shares to previously connected accounts).
   */
  private async isShareAccepted(
    identity: PlexUserIdentity,
    userId: number
  ): Promise<boolean> {
    try {
      const adminApi = await this.getAdminApi();
      const share = await adminApi.getUserShare(
        identity,
        this.settings.plex.machineId
      );
      if (share && !share.pending) {
        return true;
      }
    } catch (e) {
      logger.debug('Error attempting to check admin-side share state', {
        label: LABEL,
        userId,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
    return false;
  }
}

export const plexSync = new PlexSync();
