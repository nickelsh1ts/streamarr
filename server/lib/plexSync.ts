import PlexTvAPI, { extractPlexError } from '@server/api/plextv';
import { getRepository } from '@server/datasource';
import type { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import type {
  PlexSharePermissions,
  PlexUserIdentity,
} from '@server/interfaces/api/plexInterfaces';
import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import AsyncLock from '@server/utils/asyncLock';
import {
  isDefaultSentinel,
  materializeDefaultSnapshot,
  resolveSharedLibraryKeys,
} from '@server/utils/sharedLibraries';

const LABEL = 'Plex Sync';
const AUTO_ACCEPT_ATTEMPTS = 5;
const AUTO_ACCEPT_DELAY_MS = 3_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PlexSyncOptions {
  /** undefined leaves the current Plex value unchanged */
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
  plexHome?: boolean;
}

export interface PlexInviteOptions {
  libraries: string[];
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
  /** Invite to the owner's Plex Home instead of a regular share */
  plexHome?: boolean;
  userTokenOverride?: string;
}

/**
 * PlexSync orchestrates user library/share synchronization between
 * Streamarr and plex.tv via PlexTvAPI.
 */
class PlexSync {
  private settings = getSettings();
  private lock = new AsyncLock();

  private async getAdminApi(): Promise<PlexTvAPI> {
    const plexToken = await getAdminPlexToken();
    if (!plexToken) {
      throw new Error('Admin Plex token is missing');
    }
    return new PlexTvAPI(plexToken);
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

  private async mapKeysToSectionIds(
    api: PlexTvAPI,
    machineId: string,
    libraryKeys: string[]
  ): Promise<number[]> {
    const sections = await api.getServerSections(machineId);
    const idsByKey = new Map(
      sections.map((section) => [section.key, section.id])
    );
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
   * The empty array means "all libraries"
   */
  public async getCurrentPlexLibraries(user: User): Promise<{
    libraries: string[];
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
      throw new Error('User not found in Plex shared users list.');
    }

    return {
      libraries: share.allLibraries
        ? []
        : share.sections
            .filter((section) => section.shared)
            .map((section) => section.key),
      permissions: {
        allowSync: share.allowSync,
        allowCameraUpload: share.allowCameraUpload,
        allowChannels: share.allowChannels,
      },
    };
  }

  /**
   * Syncs a user's Plex library access to the given sharedLibraries value.
   *
   * A default sentinel (null/''/'server') is materialized to a snapshot of
   * the current server default and written back to the user's settings
   * before syncing. Resolution failures (no enabled
   * libraries) throw and leave the existing share untouched.
   * Permissions are tri-state: only explicitly provided values can trigger
   * the share recreation that updates them.
   */
  public async syncUserLibraries(
    user: User,
    sharedLibraries: string | null,
    options: PlexSyncOptions = {}
  ): Promise<void> {
    this.assertHasIdentity(user);

    await this.lock.dispatch(`plex-share-${user.id}`, async () => {
      try {
        const machineId = this.settings.plex.machineId;
        const api = await this.getAdminApi();
        const enabledLibraries = this.enabledLibraries();

        let value: string | null = sharedLibraries;
        if (isDefaultSentinel(value)) {
          const snapshot = materializeDefaultSnapshot({
            adminDefault: this.settings.main.sharedLibraries,
            enabledLibraries,
          });
          value = snapshot;
          if (user.settings && user.settings.sharedLibraries !== snapshot) {
            user.settings.sharedLibraries = snapshot;
            await getRepository(UserSettings).save(user.settings);
            logger.debug('Assigned server-default libraries to user', {
              label: LABEL,
              userId: user.id,
              snapshot,
            });
          }
        }

        const libraryKeys = resolveSharedLibraryKeys({
          value,
          adminDefault: this.settings.main.sharedLibraries,
          enabledLibraries,
        });

        if (libraryKeys.length === 0) {
          throw new Error(
            'Selected shared libraries resolve to no enabled libraries — refusing to sync.'
          );
        }

        const share = await api.getUserShare(this.getIdentity(user), machineId);
        if (!share) {
          throw new Error('User not found in Plex shared users list.');
        }

        const sectionIds = await this.mapKeysToSectionIds(
          api,
          machineId,
          libraryKeys
        );

        const permissions: PlexSharePermissions = {};
        if (options.allowSync !== undefined) {
          permissions.allowSync = options.allowSync;
        }
        if (options.allowCameraUpload !== undefined) {
          permissions.allowCameraUpload = options.allowCameraUpload;
        }
        if (options.allowChannels !== undefined) {
          permissions.allowChannels = options.allowChannels;
        }

        await api.updateUserShare({
          machineId,
          share,
          sectionIds,
          permissions,
        });
      } catch (e) {
        const message = extractPlexError(e);
        logger.error(`Failed to sync Plex libraries for user ${user.email}`, {
          label: LABEL,
          userId: user.id,
          error: message,
        });
        throw new Error(`Plex sync error: ${message}`);
      }
    });
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
      options.libraries
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
          await api.inviteHomeUser(payload);
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

  public scheduleAutoAccept(
    user: User,
    options: { userTokenOverride?: string } = {}
  ): void {
    const settings = getSettings();
    const serverName = settings.plex.name || undefined;
    const userToken = options.userTokenOverride || user.plexToken;

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
      logger.warn(
        'No user token is available — auto-accept skipped, the user must accept the invite manually',
        { label: LABEL, userId: user.id }
      );
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
