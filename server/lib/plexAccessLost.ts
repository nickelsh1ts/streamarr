import PlexTvAPI from '@server/api/plextv';
import SeerrAPI from '@server/api/seerr';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import { userAcceptsNotificationType } from '@server/lib/notifications';
import { sendGroupNotification } from '@server/lib/notifications/dispatch';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

const LABEL = 'Plex Sync';
const inFlight = new Set<number>();

/**
 * Handles a user that has been definitively removed from the Plex server's
 * shared users list (but still exists in Streamarr).
 *
 * Deactivates the account (allowing profile-only sign-in, matching the
 * trial-deactivation behavior), revokes Seerr permissions, and notifies
 * admins.
 */
export const handlePlexAccessLost = async (user: User): Promise<void> => {
  if (user.id === 1 || user.userType !== UserType.PLEX || !user.active) {
    return;
  }

  if (inFlight.has(user.id)) {
    return;
  }
  inFlight.add(user.id);

  try {
    user.active = false;
    user.accessRevokedAt = new Date();
    user.accessRevokedReason = 'plex_removed';
    await getRepository(User).save(user);

    try {
      const settingsRepository = getRepository(UserSettings);
      const userSettings =
        user.settings ??
        (await settingsRepository.findOne({
          where: { user: { id: user.id } },
        }));
      if (
        userSettings &&
        (userSettings.trialPeriodEndsAt || userSettings.trialPeriodOutcome)
      ) {
        userSettings.trialPeriodEndsAt = null;
        userSettings.trialPeriodOutcome = null;
        await settingsRepository.save(userSettings);
      }
    } catch (e) {
      logger.error('Failed to clear trial period for removed user', {
        label: LABEL,
        userId: user.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }

    logger.info(
      'User was removed from the Plex server and their account deactivated',
      {
        label: LABEL,
        userId: user.id,
        email: user.email,
      }
    );

    const seerrSettings = getSettings().overseerr;
    if (user.plexId && seerrSettings.enabled && seerrSettings.hostname) {
      try {
        const seerrApi = new SeerrAPI(seerrSettings);
        await seerrApi.revokeAllPermissionsByPlexId(user.plexId);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        // A user that was never imported into Seerr is expected, not an error
        !message.includes('not found') &&
          logger.error('Failed to revoke Seerr permissions', {
            label: LABEL,
            userId: user.id,
            errorMessage: message,
          });
      }
    }

    try {
      const admins = await getRepository(User)
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.settings', 'settings')
        .where(
          '(user.permissions & :manageUsers) = :manageUsers OR (user.permissions & :admin) = :admin',
          {
            manageUsers: Permission.MANAGE_USERS,
            admin: Permission.ADMIN,
          }
        )
        .getMany();

      const usersToNotify = admins.filter(
        (recipient) =>
          recipient.id !== user.id &&
          userAcceptsNotificationType(
            recipient,
            NotificationType.PLEX_ACCESS_LOST
          )
      );

      await sendGroupNotification(
        NotificationType.PLEX_ACCESS_LOST,
        usersToNotify,
        (intl) => ({
          subject: intl.formatMessage(
            {
              id: 'notifications.plexAccessLost.subject',
              defaultMessage: 'Plex Access Removed: {displayName}',
            },
            { displayName: user.displayName }
          ),
          message: intl.formatMessage({
            id: 'notifications.plexAccessLost.message',
            defaultMessage:
              'This user was removed from the Plex server and their account has been deactivated.',
          }),
          actionUrl: `/admin/users/${user.id}/settings`,
          actionUrlTitle: 'View User Settings',
          severity: NotificationSeverity.WARNING,
        })
      );
    } catch (e) {
      logger.error('Failed to send Plex access lost notification', {
        label: LABEL,
        userId: user.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  } finally {
    inFlight.delete(user.id);
  }
};

/**
 * Validates that every active Plex user still exists in the Plex server's
 * shared users list, deactivating any that have been removed out-of-band.
 */
let isRunning = false;
let cancelled = false;

export const validateActivePlexMembership = async (
  isCancelled?: () => boolean
): Promise<void> => {
  if (isRunning) {
    return;
  }
  isRunning = true;
  cancelled = false;

  try {
    await runMembershipValidation(
      () => cancelled || (isCancelled?.() ?? false)
    );
  } finally {
    isRunning = false;
  }
};

export const plexAccess = {
  status: (): { running: boolean } => ({
    running: isRunning,
  }),
  cancel: (): void => {
    cancelled = true;
  },
  run: async (isCancelled?: () => boolean): Promise<void> => {
    try {
      await validateActivePlexMembership(isCancelled);
    } catch (e) {
      logger.error('Plex membership check failed.', {
        label: 'Jobs',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  },
};

const runMembershipValidation = async (
  isCancelled?: () => boolean
): Promise<void> => {
  const settings = getSettings();
  const machineId = settings.plex.machineId;
  const adminToken = await getAdminPlexToken();

  if (!adminToken || !machineId) {
    logger.warn(
      'Missing admin Plex token or machineId — Plex membership validation skipped.',
      { label: 'Jobs' }
    );
    return;
  }

  const activeUsers = await getRepository(User)
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.settings', 'settings')
    .where('user.active = :active', { active: true })
    .andWhere('user.userType = :type', { type: UserType.PLEX })
    .andWhere('user.id != 1')
    .getMany();

  if (activeUsers.length === 0) {
    return;
  }

  let plexUsers: Awaited<
    ReturnType<PlexTvAPI['getUsers']>
  >['MediaContainer']['User'];
  try {
    const usersResponse = await new PlexTvAPI(adminToken).getUsers();
    const raw = usersResponse.MediaContainer.User;
    plexUsers = Array.isArray(raw) ? raw : raw ? [raw] : [];
  } catch (e) {
    logger.warn(
      'Unable to fetch shared users from plex.tv — Plex membership validation skipped.',
      {
        label: 'Jobs',
        errorMessage: e instanceof Error ? e.message : String(e),
      }
    );
    return;
  }

  if (plexUsers.length === 0) {
    logger.warn(
      'plex.tv returned no shared users — Plex membership validation skipped.',
      { label: 'Jobs' }
    );
    return;
  }

  const sharedIds = new Set<number>();
  const sharedEmails = new Set<string>();
  const sharedUsernames = new Set<string>();

  for (const plexUser of plexUsers) {
    const serversRaw = plexUser.Server;
    const servers = Array.isArray(serversRaw)
      ? serversRaw
      : serversRaw
        ? [serversRaw]
        : [];
    if (!servers.some((server) => server.$.machineIdentifier === machineId)) {
      continue;
    }
    sharedIds.add(parseInt(plexUser.$.id, 10));
    if (plexUser.$.email) {
      sharedEmails.add(plexUser.$.email.toLowerCase());
    }
    if (plexUser.$.username) {
      sharedUsernames.add(plexUser.$.username.toLowerCase());
    }
  }

  for (const user of activeUsers) {
    if (isCancelled?.()) {
      return;
    }

    const hasAccess =
      (user.plexId != null && sharedIds.has(user.plexId)) ||
      (!!user.email && sharedEmails.has(user.email.toLowerCase())) ||
      (!!user.plexUsername &&
        sharedUsernames.has(user.plexUsername.toLowerCase()));

    if (!hasAccess) {
      await handlePlexAccessLost(user);
    }
  }
};
