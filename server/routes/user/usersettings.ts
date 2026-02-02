import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import type {
  UserSettingsGeneralResponse,
  UserSettingsNotificationsResponse,
} from '@server/interfaces/api/userSettingsInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { plexSync } from '@server/lib/plexSync';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import { canMakePermissionsChange } from '@server/routes/user';
import { UserType } from '@server/constants/user';
import axios from 'axios';

const isOwnProfileOrAdmin = () => {
  const authMiddleware = (req, res, next) => {
    if (
      !req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== Number(req.params.id)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to view this user's settings.",
      });
    }

    next();
  };
  return authMiddleware;
};

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
        liveTv,
        plexHome,
        enableTrialPeriod,
        trialPeriodDays,
        releaseSched,
      },
      tautulli: { urlBase, enabled: tautulliEnabled },
      overseerr: {
        urlBase: requestUrl,
        hostname: overseerrHostname,
        port: overseerrPort,
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
        globalLiveTv: liveTv,
        globalPlexHome: plexHome,
        sharedLibraries: user.settings?.sharedLibraries ?? null,
        allowDownloads: user.settings?.allowDownloads ?? false,
        allowLiveTv: user.settings?.allowLiveTv ?? false,
        globalSharedLibraries: defaultSharedLibraries,
        trialPeriodEndsAt: user.settings?.trialPeriodEndsAt ?? null,
        globalEnableTrialPeriod: enableTrialPeriod,
        globalTrialPeriodDays: trialPeriodDays,
        tautulliBaseUrl: urlBase,
        tautulliEnabled: tautulliEnabled,
        requestUrl: requestUrl,
        requestHostname: `${overseerrHostname}:${overseerrPort}`,
        releaseSched: releaseSched,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
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
    const previousAllowLiveTv = user.settings?.allowLiveTv;
    const newSharedLibraries =
      req.body.sharedLibraries === '' || req.body.sharedLibraries === 'server'
        ? null
        : req.body.sharedLibraries;
    const newAllowDownloads = req.body.allowDownloads;
    const newAllowLiveTv = req.body.allowLiveTv;
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
        user: req.user,
        locale: req.body.locale,
        sharedLibraries: newSharedLibraries,
        allowDownloads: req.body.allowDownloads ?? false,
        allowLiveTv: req.body.allowLiveTv ?? false,
      });
    } else {
      user.settings.locale = req.body.locale;
      user.settings.sharedLibraries = newSharedLibraries;
      user.settings.allowDownloads = req.body.allowDownloads ?? false;
      user.settings.allowLiveTv = req.body.allowLiveTv ?? false;
    }

    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user.id !== user.id &&
      user.id !== 1 &&
      !user.hasPermission(Permission.MANAGE_USERS) &&
      req.body.trialPeriodEndsAt !== undefined
    ) {
      if (req.body.trialPeriodEndsAt === null) {
        user.settings.trialPeriodEndsAt = null;
      } else {
        const trialDate = new Date(req.body.trialPeriodEndsAt);

        if (isNaN(trialDate.getTime())) {
          return next({
            status: 400,
            message: 'Invalid trial period end date.',
          });
        }

        user.settings.trialPeriodEndsAt = trialDate;
      }
    }

    await userRepository.save(user);

    // Sync with Plex if sharedLibraries changed, or forcePlexSync is true, and user has permissions
    const shouldSync =
      previousSharedLibraries !== newSharedLibraries ||
      previousAllowDownloads !== newAllowDownloads ||
      previousAllowLiveTv !== newAllowLiveTv ||
      forcePlexSync;

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
          allowChannels: req.body.allowLiveTv,
          plexHome: false,
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
      res.status(204).send();
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
        emailEnabled: settings.email.enabled,
        pgpKey: user.settings?.pgpKey,
        webPushEnabled: settings.webpush.enabled,
        inAppEnabled: settings.inApp.enabled,
        notificationTypes: user.settings?.notificationTypes ?? {},
      });
    } catch (e) {
      next({ status: 500, message: e.message });
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
        user.settings = new UserSettings({
          user: req.user,
          pgpKey: req.body.pgpKey,
          notificationTypes: req.body.notificationTypes,
        });
      } else {
        user.settings.pgpKey = req.body.pgpKey;
        user.settings.notificationTypes = Object.assign(
          {},
          user.settings.notificationTypes,
          req.body.notificationTypes
        );
      }

      userRepository.save(user);

      res.status(200).json({
        pgpKey: user.settings.pgpKey,
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

      const mainUser = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      if (!mainUser || !mainUser.plexToken) {
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

      const librariesResponse = await axios.get(
        'http://localhost:5005/library-details',
        {
          params: {
            token: mainUser.plexToken,
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
      let librariesToPin = allLibraries.filter((lib: { id: string }) =>
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

export default userSettingsRoutes;
