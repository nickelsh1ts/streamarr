import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import SeerrAPI from '@server/api/seerr';
import { UserSettings } from '@server/entity/UserSettings';
import type {
  UserSettingsGeneralResponse,
  UserSettingsNotificationsResponse,
} from '@server/interfaces/api/userSettingsInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { plexSync } from '@server/lib/plexSync';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import { canMakePermissionsChange } from '@server/routes/user';
import { UserType } from '@server/constants/user';
import axios from 'axios';
import PlexTvAPI from '@server/api/plextv';
import PushoverAPI from '@server/api/pushover';
import {
  isOwnProfile,
  isOwnProfileOrAdmin,
} from '@server/utils/profileMiddleware';
import { trialExtensionRequestLimiter } from '@server/lib/rateLimiters';
import moment from '@server/utils/momentWithLocale';
import { sendGroupNotification } from '@server/lib/notifications/dispatch';

const userSettingsRoutes = Router({ mergeParams: true });

userSettingsRoutes.get<{ id: string }, UserSettingsGeneralResponse>(
  '/main',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const {
      main: {
        defaultQuotas,
        sharedLibraries: defaultSharedLibraries,
        downloads,
        plexHome,
        liveTv: globalLiveTv,
        enableTrialPeriod,
        trialPeriodDays,
        trialPeriodOutcome,
        releaseSched,
      },
      tautulli: { urlBase, enabled: tautulliEnabled },
      overseerr: {
        urlBase: requestUrl,
        hostname: overseerrHostname,
        port: overseerrPort,
        enabled: overseerrEnabled,
      },
    } = getSettings();
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      res.status(200).json({
        username: user.username,
        locale: user.settings?.locale,
        inviteQuotaLimit: user.inviteQuotaLimit,
        inviteQuotaDays: user.inviteQuotaDays,
        globalInviteQuotaDays: defaultQuotas.invites.quotaDays,
        globalInviteQuotaLimit: defaultQuotas.invites.quotaLimit,
        globalInviteUsageLimit: defaultQuotas.invites.quotaUsage,
        globalInvitesExpiryLimit: defaultQuotas.invites.quotaExpiryLimit,
        globalInvitesExpiryTime: defaultQuotas.invites.quotaExpiryTime,
        globalAllowDownloads: downloads,
        globalLiveTv: globalLiveTv,
        globalPlexHome: plexHome,
        sharedLibraries: user.settings?.sharedLibraries ?? null,
        allowDownloads: user.settings?.allowDownloads ?? false,
        allowLiveTv: user.settings?.allowLiveTv ?? false,
        allowPlexHome: user.settings?.allowPlexHome ?? false,
        globalSharedLibraries: defaultSharedLibraries,
        trialPeriodEndsAt: user.settings?.trialPeriodEndsAt ?? null,
        trialPeriodOutcome: user.settings?.trialPeriodOutcome ?? null,
        trialExtensionRequested:
          user.settings?.trialExtensionRequested ?? false,
        trialExtensionRequestedAt:
          user.settings?.trialExtensionRequestedAt ?? null,
        globalEnableTrialPeriod: enableTrialPeriod,
        globalTrialPeriodDays: trialPeriodDays,
        globalTrialPeriodOutcome: trialPeriodOutcome,
        tautulliBaseUrl: urlBase,
        tautulliEnabled: tautulliEnabled,
        requestUrl: requestUrl,
        requestHostname: `${overseerrHostname}:${overseerrPort}`,
        requestEnabled: overseerrEnabled,
        releaseSched: releaseSched,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<{ id: string }>(
  '/extension',
  trialExtensionRequestLimiter,
  isOwnProfile(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (user.active) {
        if (!getSettings().main.enableTrialPeriod) {
          return next({
            status: 403,
            message: 'Trial periods are not enabled.',
          });
        }
        if (!user.settings?.trialPeriodEndsAt) {
          return next({
            status: 403,
            message:
              'Trial extension requests are only available for users in trial or already expired.',
          });
        }
      }

      if (!user.settings) {
        user.settings = new UserSettings({
          user,
          trialPeriodOutcome: getSettings().main.trialPeriodOutcome,
          trialExtensionRequested: false,
          trialExtensionRequestedAt: null,
        });
      }

      if (user.settings.trialExtensionRequested) {
        return res.status(204).send();
      }

      user.settings.trialExtensionRequested = true;
      user.settings.trialExtensionRequestedAt = new Date();

      await userRepository.save(user);

      const admins = await userRepository
        .createQueryBuilder('user')
        .where(
          '(user.permissions & :manageUsers) = :manageUsers OR (user.permissions & :admin) = :admin',
          {
            manageUsers: Permission.MANAGE_USERS,
            admin: Permission.ADMIN,
          }
        )
        .getMany();

      await sendGroupNotification(
        NotificationType.ACCESS_EXTENSION_REQUESTED,
        admins,
        (intl) => ({
          subject: intl.formatMessage({
            id: 'notifications.userSettings.extensionRequested',
            defaultMessage: 'Access extension requested',
          }),
          message: intl.formatMessage(
            {
              id: 'notifications.userSettings.extensionRequestedMessage',
              defaultMessage:
                '{displayName} requested an access extension. {isPast, select, true {Trial Ended} other {Trial Ends}}: {accessEndDate}',
            },
            {
              displayName: user.displayName,
              accessEndDate:
                moment(user.settings.trialPeriodEndsAt ?? user.accessRevokedAt)
                  .locale(intl.locale)
                  .format('MMM D, h:mm A') ?? 'Unknown',
              isPast: moment(
                user.settings.trialPeriodEndsAt ?? user.accessRevokedAt
              ).isBefore(moment()),
            }
          ),
          actionUrl: `/admin/users/${user.id}/settings`,
          actionUrlTitle: 'Manage User',
          severity: NotificationSeverity.WARNING,
        })
      );

      return res.status(204).send();
    } catch (e) {
      return next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  UserSettingsGeneralResponse,
  UserSettingsGeneralResponse
>('/main', isOwnProfileOrAdmin(), async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found.' });
    }

    // "Owner" user settings cannot be modified by other users
    if (user.id === 1 && req.user?.id !== 1) {
      return next({
        status: 403,
        message: "You do not have permission to modify this user's settings.",
      });
    }

    // Store previous sharedLibraries value to detect changes
    const previousSharedLibraries = user.settings?.sharedLibraries;
    const previousAllowDownloads = user.settings?.allowDownloads;
    const previousAllowPlexHome = user.settings?.allowPlexHome ?? false;
    const previousState = user.active;
    const newSharedLibraries =
      req.body.sharedLibraries === '' || req.body.sharedLibraries === 'server'
        ? null
        : req.body.sharedLibraries;
    const newAllowDownloads = req.body.allowDownloads;
    const forcePlexSync = req.body.forcePlexSync === true;

    user.username = req.body.username;

    // Update quota values only if the user has the correct permissions
    if (
      !user.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== user.id
    ) {
      user.inviteQuotaDays = req.body.inviteQuotaDays;
      user.inviteQuotaLimit = req.body.inviteQuotaLimit;
    }

    if (!user.settings) {
      user.settings = new UserSettings({
        user,
        locale: req.body.locale,
        sharedLibraries: newSharedLibraries,
        allowDownloads: req.body.allowDownloads ?? false,
        allowLiveTv: req.body.allowLiveTv ?? false,
        allowPlexHome:
          req.user?.id === 1 ? (req.body.allowPlexHome ?? false) : false,
        trialPeriodOutcome: getSettings().main.trialPeriodOutcome,
      });
    } else {
      user.settings.locale = req.body.locale;
      user.settings.sharedLibraries = newSharedLibraries;
      user.settings.allowDownloads = req.body.allowDownloads ?? false;
      user.settings.allowLiveTv = req.body.allowLiveTv ?? false;
      if (req.user?.id === 1) {
        user.settings.allowPlexHome = req.body.allowPlexHome ?? false;
      }
    }

    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user.id !== user.id &&
      user.id !== 1 &&
      !user.hasPermission(Permission.MANAGE_USERS) &&
      (req.body.trialPeriodEndsAt !== undefined ||
        req.body.trialPeriodOutcome !== undefined)
    ) {
      if (
        req.body.trialPeriodEndsAt === null ||
        req.body.trialPeriodOutcome === null
      ) {
        user.settings.trialPeriodEndsAt = null;
        user.settings.trialPeriodOutcome = null;
        user.settings.trialExtensionRequested = false;
        user.settings.trialExtensionRequestedAt = null;
        if (!user.active) {
          user.active = true;
          user.accessRevokedAt = null;
        }
      } else {
        const trialDate = new Date(req.body.trialPeriodEndsAt);
        const trialPeriodOutcome =
          req.body.trialPeriodOutcome ??
          user.settings?.trialPeriodOutcome ??
          getSettings().main.trialPeriodOutcome;

        if (
          isNaN(trialDate.getTime()) ||
          (trialPeriodOutcome !== 'promote' &&
            trialPeriodOutcome !== 'deactivate')
        ) {
          return next({
            status: 400,
            message:
              'Invalid trial period settings. Provide a valid ISO date for trialPeriodEndsAt and outcome must be "promote" or "deactivate".',
          });
        }

        user.settings.trialPeriodEndsAt = trialDate;
        user.settings.trialPeriodOutcome = trialPeriodOutcome;
        user.settings.trialExtensionRequested = false;
        user.settings.trialExtensionRequestedAt = null;

        if (
          (trialPeriodOutcome === 'promote' && !user.active) ||
          trialDate > new Date()
        ) {
          user.active = true;
          user.accessRevokedAt = null;
        } else if (
          trialPeriodOutcome === 'deactivate' &&
          user.active &&
          trialDate < new Date()
        ) {
          user.active = false;
          user.accessRevokedAt = new Date();
        }
      }
    }

    await userRepository.save(user);

    const plexHomeChanged =
      user.userType === UserType.PLEX &&
      user.active &&
      (user.settings?.allowPlexHome ?? false) !== previousAllowPlexHome;

    if (user.plexId && (previousState !== user.active || plexHomeChanged)) {
      const settings = getSettings();
      const seerrSettings = settings.overseerr;

      const admin = await getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      if (!admin?.plexToken || !settings.plex.machineId) {
        logger.warn('Missing plex admin token or machine id', {
          label: 'User Settings',
          userId: user.id,
        });
      } else {
        try {
          const plexTvApi = new PlexTvAPI(admin.plexToken);
          if (previousState && !plexHomeChanged) {
            try {
              await plexTvApi.deprovisionUser(
                user.plexId,
                settings.plex.machineId
              );
            } catch (e) {
              logger.error('Failed to deprovision user.', {
                label: 'User Settings',
                userId: user.id,
                errorMessage: e instanceof Error ? e.message : String(e),
              });
            }
          } else {
            if (plexHomeChanged) {
              try {
                await plexTvApi.deprovisionUser(
                  user.plexId,
                  settings.plex.machineId
                );
              } catch (e) {
                logger.error(
                  'Failed to deprovision user before plexHome re-invite',
                  {
                    label: 'User Settings',
                    userId: user.id,
                    errorMessage: e instanceof Error ? e.message : String(e),
                  }
                );
              }
            }

            const inviteAttempts = [user.email, user.plexUsername].filter(
              Boolean
            );

            const librarySectionIds =
              user.settings?.sharedLibraries === 'all' ||
              ((user.settings?.sharedLibraries === 'server' ||
                user.settings?.sharedLibraries === '' ||
                user.settings?.sharedLibraries === null) &&
                getSettings().main.sharedLibraries === 'all')
                ? getSettings()
                    .plex.libraries.filter((lib) => lib.enabled)
                    .map((lib) => lib.id)
                : user.settings?.sharedLibraries === 'server'
                  ? null
                  : (user.settings?.sharedLibraries
                      ?.split(/[,|]/)
                      .map((id) => id.trim())
                      .filter((id) => id !== '') ??
                    getSettings()
                      .main.sharedLibraries.split(/[,|]/)
                      .map((id) => id.trim())
                      .filter(
                        (id) =>
                          id !== '' &&
                          getSettings()
                            .plex.libraries.filter((lib) => lib.enabled)
                            .some((lib) => lib.id === id)
                      ));

            for (const identifier of inviteAttempts) {
              try {
                const response = await axios.post(
                  'http://localhost:5005/invite',
                  {
                    token: admin.plexToken,
                    server_id: settings.plex.machineId,
                    email: identifier,
                    libraries: librarySectionIds,
                    allow_sync: user?.settings?.allowDownloads ?? false,
                    allow_camera_upload: false,
                    plex_home: user.settings?.allowPlexHome ?? false,
                    user_token: user.plexToken,
                  }
                );

                if (!response.data.success)
                  throw new Error(
                    response.data.error ||
                      'Failed to invite user via Python service'
                  );
                break;
              } catch (e) {
                logger.warn(`Plex invite attempt failed for ${identifier}`, {
                  label: 'User Settings',
                  errorMessage: e instanceof Error ? e.message : String(e),
                });
              }
            }
          }
        } catch (e) {
          logger.error(
            `Failed to ${previousState && !plexHomeChanged ? 'deprovision' : 'provision'} user`,
            {
              label: 'User Settings',
              userId: user.id,
              errorMessage: e instanceof Error ? e.message : String(e),
            }
          );
        }
      }

      if (
        seerrSettings.enabled &&
        seerrSettings.hostname &&
        previousState !== user.active
      ) {
        try {
          const seerrApi = new SeerrAPI(seerrSettings);
          if (previousState) {
            await seerrApi.revokeAllPermissionsByPlexId(user.plexId);
          } else {
            await seerrApi.restoreDefaultPermissionsByPlexId(user.plexId);
          }
        } catch (e) {
          logger.error(
            `Failed to ${previousState ? 'revoke' : 'restore'} Seerr permissions`,
            {
              label: 'User Settings',
              userId: user.id,
              errorMessage: e instanceof Error ? e.message : String(e),
            }
          );
        }
      }
    }

    // Sync with Plex if sharedLibraries changed, or forcePlexSync is true, and user has permissions.
    // Skip when a plexHome re-invite just ran — the invite already set up libraries
    const shouldSync =
      (previousSharedLibraries !== newSharedLibraries ||
        previousAllowDownloads !== newAllowDownloads ||
        forcePlexSync ||
        !previousState) &&
      !plexHomeChanged &&
      user.active;

    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      shouldSync &&
      user.email &&
      user.userType === UserType.PLEX
    ) {
      try {
        const syncValue = newSharedLibraries || 'server';
        await plexSync.syncUserLibraries(user, syncValue, {
          allowSync: req.body.allowDownloads,
          allowCameraUpload: false,
          plexHome: user.settings?.allowPlexHome ?? false,
        });
      } catch (syncError) {
        logger.error('Failed to sync user libraries with Plex', {
          label: 'Plex Sync',
          userId: user.id,
          email: user.email,
          error: syncError.message,
        });
      }
    }

    res.status(200).json({
      username: user.username,
      locale: user.settings.locale,
    });
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

userSettingsRoutes.get<{ id: string }, { hasPassword: boolean }>(
  '/password',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
        select: ['id', 'password'],
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      res.status(200).json({ hasPassword: !!user.password });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  null,
  { currentPassword?: string; newPassword: string }
>('/password', isOwnProfileOrAdmin(), async (req, res, next) => {
  const userRepository = getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    const userWithPassword = await userRepository.findOne({
      select: ['id', 'password'],
      where: { id: Number(req.params.id) },
    });

    if (!user || !userWithPassword) {
      return next({ status: 404, message: 'User not found.' });
    }

    if (req.body.newPassword.length < 8) {
      return next({
        status: 400,
        message: 'Password must be at least 8 characters.',
      });
    }

    if (
      (user.id === 1 && req.user?.id !== 1) ||
      (user.hasPermission(Permission.ADMIN) &&
        user.id !== req.user?.id &&
        req.user?.id !== 1)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to modify this user's password.",
      });
    }

    // If the user has the permission to manage users and they are not
    // editing themselves, we will just set the new password
    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== user.id
    ) {
      await user.setPassword(req.body.newPassword);
      await userRepository.save(user);
      logger.debug('Password overriden by user.', {
        label: 'User Settings',
        userEmail: user.email,
        changingUser: req.user.email,
      });
      return res.status(204).send();
    }

    // If the user has a password, we need to check the currentPassword is correct
    if (
      user.password &&
      (!req.body.currentPassword ||
        !(await userWithPassword.passwordMatch(req.body.currentPassword)))
    ) {
      logger.debug(
        'Attempt to change password for user failed. Invalid current password provided.',
        { label: 'User Settings', userEmail: user.email }
      );
      return next({ status: 403, message: 'Current password is invalid.' });
    }

    await user.setPassword(req.body.newPassword);
    await userRepository.save(user);

    res.status(204).send();
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

userSettingsRoutes.post<{ id: string }, unknown, { authToken: string }>(
  '/linked-accounts/plex',
  isOwnProfile(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    let account: Awaited<ReturnType<PlexTvAPI['getUser']>>;
    try {
      const plextv = new PlexTvAPI(req.body.authToken);
      account = await plextv.getUser();
    } catch {
      return next({ status: 401, message: 'Invalid or expired Plex token.' });
    }

    try {
      if (await userRepository.exists({ where: { plexId: account.id } })) {
        return next({
          status: 422,
          message: 'This Plex account is already linked to a Streamarr user.',
        });
      }

      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
        relations: ['settings'],
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (user.email?.toLowerCase() !== account.email?.toLowerCase()) {
        return next({
          status: 422,
          message:
            'This Plex account is registered under a different email address.',
        });
      }

      const plexServerId = getSettings().plex.machineId;
      let librarySectionIds: string[] = [];

      const adminUser = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      // Resolve the libraries to share: honour any pre-existing user setting first,
      // then fall back to the admin-configured default.
      const existingSharedLibraries = user.settings?.sharedLibraries;
      const enabledLibraries = getSettings().plex.libraries.filter(
        (lib) => lib.enabled
      );

      if (existingSharedLibraries) {
        // User already has explicit library settings — validate against enabled list
        const requestedIds = existingSharedLibraries
          .split(/[,|]/)
          .map((id) => id.trim())
          .filter((id) => id !== '');
        librarySectionIds = requestedIds.filter((libId) =>
          enabledLibraries.some((enabled) => enabled.id === libId)
        );
      } else {
        // Fall back to admin default shared libraries
        const defaultLibs = getSettings().main.sharedLibraries;

        if (defaultLibs === 'all' || !defaultLibs) {
          librarySectionIds = enabledLibraries.map((lib) => lib.id);
        } else {
          const adminConfiguredLibs = defaultLibs
            .split(/[,|]/)
            .map((id) => id.trim())
            .filter((id) => id !== '');
          librarySectionIds = adminConfiguredLibs.filter((libId) =>
            enabledLibraries.some((enabled) => enabled.id === libId)
          );
        }
      }

      // valid plex user found, link to current user
      user.userType = UserType.PLEX;
      user.plexId = account.id;
      user.plexUsername = account.username;
      user.plexToken = account.authToken;

      if (!user.settings) {
        user.settings = new UserSettings({
          user,
          sharedLibraries:
            librarySectionIds.length > 0 ? librarySectionIds.join('|') : null,
          allowDownloads: getSettings().main.downloads ?? false,
          allowLiveTv: getSettings().main.liveTv ?? false,
        });
      } else {
        // Only overwrite sharedLibraries if the user didn't already have an explicit value
        if (!existingSharedLibraries) {
          user.settings.sharedLibraries =
            librarySectionIds.length > 0 ? librarySectionIds.join('|') : null;
        }
        user.settings.allowDownloads =
          user.settings.allowDownloads ?? getSettings().main.downloads ?? false;
        user.settings.allowLiveTv =
          user.settings.allowLiveTv ?? getSettings().main.liveTv ?? false;
      }

      await userRepository.save(user);

      if (!adminUser || !adminUser.plexToken) {
        logger.error(
          'Missing Plex admin token — skipping Plex invitation for linked account',
          { label: 'User Settings', userEmail: user.email }
        );
        return res.status(204).send();
      }

      // Check whether the user already has access to the Plex server.
      const mainPlexTv = new PlexTvAPI(adminUser.plexToken);
      let alreadyOnServer = false;
      try {
        alreadyOnServer = await mainPlexTv.checkUserAccess(account.id);
      } catch (e) {
        logger.error('Failed to check Plex server access for linked account', {
          label: 'User Settings',
          userEmail: user.email,
          error: e.message,
        });
      }

      const identifiers = [user.email, user.plexUsername].filter(
        (identifier): identifier is string => !!identifier
      );

      if (alreadyOnServer) {
        // User already has server access — update libraries
        for (const identifier of identifiers) {
          try {
            const response = await axios.post(
              'http://localhost:5005/libraries',
              {
                token: adminUser.plexToken,
                server_id: plexServerId,
                email: identifier,
                libraries: librarySectionIds,
                allow_sync: getSettings().main.downloads ?? false,
                allow_camera_upload: false,
                allow_channels: false,
              }
            );

            if (!response.data.success) {
              throw new Error(
                response.data.error || 'Failed to update shared libraries'
              );
            }

            logger.debug('Plex account linked successfully', {
              label: 'User Settings',
              userEmail: user.email,
              identifier,
              sharedLibraries: librarySectionIds,
            });
            break;
          } catch (e) {
            logger.warn(`Plex account link attempt failed`, {
              label: 'User Settings',
              userEmail: user.email,
              identifier,
              message: e.message,
              responseData: e.response?.data,
            });
          }
        }
      } else {
        // User not yet on server — send invite with auto-accept
        for (const identifier of identifiers) {
          try {
            const response = await axios.post('http://localhost:5005/invite', {
              token: adminUser.plexToken,
              server_id: plexServerId,
              server_name: getSettings().plex.name || null,
              email: identifier,
              libraries: librarySectionIds,
              allow_sync: getSettings().main.downloads ?? false,
              allow_camera_upload: false,
              allow_channels: false,
              plex_home: user.settings?.allowPlexHome ?? false,
              user_token: req.body.authToken || user.plexToken || null,
            });

            if (!response.data.success) {
              throw new Error(
                response.data.error ||
                  'Failed to invite user via Python service'
              );
            }

            logger.debug('Plex account linked successfully', {
              label: 'User Settings',
              userEmail: user.email,
              identifier,
              sharedLibraries: librarySectionIds,
            });
            break;
          } catch (e) {
            logger.warn(`Plex account link attempt failed`, {
              label: 'User Settings',
              userEmail: user.email,
              identifier,
              message: e.message,
              responseData: e.response?.data,
            });
          }
        }
      }

      return res.status(204).send();
    } catch (e) {
      return next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.delete<{ id: string }>(
  '/linked-accounts/plex',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where({
          id: Number(req.params.id),
        })
        .getOne();

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (user.id === 1) {
        return next({
          status: 400,
          message:
            'Cannot unlink media server accounts for the primary administrator.',
        });
      }

      if (!user.email || !user.password) {
        return next({
          status: 400,
          message: 'User does not have a local email or password set.',
        });
      }

      user.userType = UserType.LOCAL;
      user.plexId = null;
      user.plexUsername = null;
      user.plexToken = null;
      await userRepository.save(user);

      return res.status(204).send();
    } catch (e) {
      return next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.get<{ id: string }, UserSettingsNotificationsResponse>(
  '/notifications',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const settings = getSettings()?.notifications.agents;

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      res.status(200).json({
        discordEnabled: settings.discord.enabled,
        emailEnabled: settings.email.enabled,
        pgpKey: user.settings?.pgpKey,
        pushbulletEnabled: settings.pushbullet.enabled,
        pushbulletAccessToken: user.settings?.pushbulletAccessToken,
        pushoverEnabled: settings.pushover.enabled,
        pushoverApplicationToken: user.settings?.pushoverApplicationToken,
        pushoverUserKey: user.settings?.pushoverUserKey,
        pushoverSound: user.settings?.pushoverSound,
        telegramEnabled: settings.telegram.enabled,
        telegramBotUsername: settings.telegram.options.botUsername,
        telegramChatId: user.settings?.telegramChatId,
        telegramMessageThreadId: user.settings?.telegramMessageThreadId,
        telegramSendSilently: user.settings?.telegramSendSilently,
        webPushEnabled: settings.webpush.enabled,
        inAppEnabled: settings.inApp.enabled,
        discordId: user.settings?.discordId,
        notificationTypes: user.settings?.notificationTypes ?? {},
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.get<{ id: string }>(
  '/notifications/pushover/sounds',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const pushoverApi = new PushoverAPI();

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      const token = user.settings?.pushoverApplicationToken;
      if (!token) {
        return next({
          status: 400,
          message:
            'Pushover application token is not configured for this user.',
        });
      }

      const sounds = await pushoverApi.getSounds(token);
      res.status(200).json(
        sounds.map((sound) => ({
          value: sound.name,
          label: sound.description,
        }))
      );
    } catch (e) {
      next({
        status: 500,
        message:
          e instanceof Error
            ? e.message
            : 'Unable to retrieve Pushover sounds.',
      });
    }
  }
);

userSettingsRoutes.post<{ id: string }, UserSettingsNotificationsResponse>(
  '/notifications',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      // "Owner" user settings cannot be modified by other users
      if (user.id === 1 && req.user?.id !== 1) {
        return next({
          status: 403,
          message: "You do not have permission to modify this user's settings.",
        });
      }

      if (!user.settings) {
        user.settings = new UserSettings({ user });
      }

      // Discord IDs are interpolated into mention syntax in the Discord agent,
      // so reject anything that is not a valid numeric snowflake to prevent
      // mention injection (e.g. @everyone) into the shared channel.
      if (
        req.body.discordId != null &&
        req.body.discordId !== '' &&
        !/^\d{17,20}$/.test(req.body.discordId)
      ) {
        return next({
          status: 400,
          message: 'Discord user ID must be a valid numeric ID.',
        });
      }

      user.settings.discordId = req.body.discordId ?? user.settings.discordId;
      user.settings.pgpKey = req.body.pgpKey ?? user.settings.pgpKey;
      user.settings.pushbulletAccessToken =
        req.body.pushbulletAccessToken ?? user.settings.pushbulletAccessToken;
      user.settings.pushoverApplicationToken =
        req.body.pushoverApplicationToken ??
        user.settings.pushoverApplicationToken;
      user.settings.pushoverUserKey =
        req.body.pushoverUserKey ?? user.settings.pushoverUserKey;
      user.settings.pushoverSound =
        req.body.pushoverSound ?? user.settings.pushoverSound;
      user.settings.telegramChatId =
        req.body.telegramChatId ?? user.settings.telegramChatId;
      user.settings.telegramMessageThreadId =
        req.body.telegramMessageThreadId ??
        user.settings.telegramMessageThreadId;
      user.settings.telegramSendSilently =
        req.body.telegramSendSilently ?? user.settings.telegramSendSilently;
      user.settings.notificationTypes = Object.assign(
        {},
        user.settings.notificationTypes,
        req.body.notificationTypes
      );

      await userRepository.save(user);

      res.status(200).json({
        discordId: user.settings.discordId,
        pgpKey: user.settings.pgpKey,
        pushbulletAccessToken: user.settings.pushbulletAccessToken,
        pushoverApplicationToken: user.settings.pushoverApplicationToken,
        pushoverUserKey: user.settings.pushoverUserKey,
        pushoverSound: user.settings.pushoverSound,
        telegramChatId: user.settings.telegramChatId,
        telegramMessageThreadId: user.settings.telegramMessageThreadId,
        telegramSendSilently: user.settings.telegramSendSilently,
        notificationTypes: user.settings.notificationTypes,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.get<{ id: string }, { permissions?: number }>(
  '/permissions',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      res.status(200).json({ permissions: user.permissions });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<
  { id: string },
  { permissions?: number },
  { permissions: number }
>(
  '/permissions',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      // "Owner" user permissions cannot be modified, and users cannot set their own permissions
      if (user.id === 1 || req.user?.id === user.id) {
        return next({
          status: 403,
          message: 'You do not have permission to modify this user',
        });
      }

      if (!canMakePermissionsChange(req.body.permissions, req.user)) {
        return next({
          status: 403,
          message: 'You do not have permission to grant this level of access',
        });
      }
      user.permissions = req.body.permissions;

      await userRepository.save(user);

      res.status(200).json({ permissions: user.permissions });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

userSettingsRoutes.post<{ id: string }>(
  '/pin-libraries',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const userRepository = getRepository(User);

    try {
      const user = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: Number(req.params.id) })
        .leftJoinAndSelect('user.settings', 'settings')
        .getOne();

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (user.userType !== UserType.PLEX) {
        return next({
          status: 400,
          message: 'Library pinning is only available for Plex users.',
        });
      }

      if (!user.plexToken) {
        return next({
          status: 400,
          message: 'User does not have a Plex token.',
        });
      }

      const adminUser = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      if (!adminUser || !adminUser.plexToken) {
        return next({
          status: 500,
          message: 'Admin Plex token missing',
        });
      }

      const plexSettings = getSettings().plex;

      if (!plexSettings?.machineId) {
        return next({
          status: 500,
          message: 'Plex server not configured.',
        });
      }

      let librariesToPin: { id: string; name: string; type: string }[];

      if (user.id === 1) {
        librariesToPin = plexSettings.libraries.map((lib) => ({
          id: lib.id,
          name: lib.name,
          type: lib.type,
        }));
      } else {
        const librariesResponse = await axios.get(
          'http://localhost:5005/library-details',
          {
            params: {
              token: adminUser.plexToken,
              server_id: plexSettings.machineId,
              email: user.email,
            },
            timeout: 15000,
          }
        );

        if (
          !librariesResponse.data.success ||
          !librariesResponse.data.libraries
        ) {
          return next({
            status: 500,
            message: 'Failed to get library information.',
          });
        }

        const allLibraries = librariesResponse.data.libraries;
        const userSharedLibraries = user.settings?.sharedLibraries;
        librariesToPin = allLibraries.filter((lib: { id: string }) =>
          getSettings().main.sharedLibraries.split('|').includes(lib.id)
        );

        if (userSharedLibraries && userSharedLibraries !== 'all') {
          const allowedLibraryIds = userSharedLibraries.split('|');
          librariesToPin = allLibraries.filter((lib: { id: string }) =>
            allowedLibraryIds.includes(lib.id)
          );
        } else if (userSharedLibraries && userSharedLibraries === 'all') {
          librariesToPin = allLibraries.filter((lib: { id: string }) =>
            getSettings().plex.libraries.some(
              (library) => library.id === lib.id && library.enabled
            )
          );
        }
      }

      if (librariesToPin.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No libraries to pin.',
          pinned_count: 0,
        });
        return;
      }

      const pythonResponse = await axios.post(
        'http://localhost:5005/pin-libraries',
        {
          user_token: user.plexToken,
          server_id: plexSettings.machineId,
          server_name: plexSettings.name || 'Streamarr',
          libraries: librariesToPin,
        },
        {
          timeout: 30000,
        }
      );

      if (pythonResponse.data.success) {
        logger.debug('Libraries pinned successfully', {
          label: 'Plex Sync',
          userId: user.id,
          email: user.email,
          pinned_count: pythonResponse.data.pinned_count,
        });

        res.status(200).json({
          success: true,
          message: pythonResponse.data.message,
          pinned_count: pythonResponse.data.pinned_count,
        });
      } else {
        logger.error('Failed to pin libraries', {
          label: 'Plex Sync',
          userId: user.id,
          error: pythonResponse.data.error,
        });

        return next({
          status: 500,
          message: pythonResponse.data.error || 'Failed to pin libraries.',
        });
      }
    } catch (e) {
      logger.error('Something went wrong trying to pin libraries', {
        label: 'Plex Sync',
        userId: req.params.id,
        error: e?.message || e,
      });

      return next({
        status: 500,
        message: `Failed to pin libraries: ${e?.message || 'Unknown error'}`,
      });
    }
  }
);

userSettingsRoutes.get<{ id: string }>(
  '/seerr/quota',
  isOwnProfileOrAdmin(),
  async (req, res, next) => {
    const seerrSettings = getSettings().overseerr;
    const userRepository = getRepository(User);

    if (!seerrSettings.enabled || !seerrSettings.hostname) {
      return res.status(404).json({
        message: 'Seerr is not configured.',
      });
    }

    try {
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (!user.plexId) {
        return next({
          status: 400,
          message: 'User does not have a Plex ID associated.',
        });
      }

      if (
        (user.id === 1 && req.user?.id !== 1) ||
        (user.hasPermission(Permission.ADMIN) &&
          user.id !== req.user?.id &&
          req.user?.id !== 1)
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to view this user's Seerr quota.",
        });
      }

      const seerrApi = new SeerrAPI(seerrSettings);
      const quota = await seerrApi.getUserQuotaWithUsageByPlexId(user.plexId);

      res.status(200).json(quota);
    } catch {
      next({
        status: 500,
        message: 'Failed to fetch Seerr user quota information.',
      });
    }
  }
);

export default userSettingsRoutes;
