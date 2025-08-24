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

      let sharedLibraries: string;
      if (user.userType === UserType.PLEX && user.id !== 1) {
        try {
          const currentPlexLibraries =
            await plexSync.getCurrentPlexLibraries(user);

          if (currentPlexLibraries.length > 0) {
            sharedLibraries = currentPlexLibraries.join('|');
          } else {
            sharedLibraries = user.settings?.sharedLibraries || 'server';
          }
        } catch (error) {
          logger.warn(
            `Could not fetch current Plex libraries for user ${user.email}`,
            {
              userId: user.id,
              error: error.message,
            }
          );
          sharedLibraries = user.settings?.sharedLibraries || 'server';
        }
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
        sharedLibraries: sharedLibraries ?? 'server',
        allowDownloads: user.settings?.allowDownloads ?? false,
        allowLiveTv: user.settings?.allowLiveTv ?? false,
        globalSharedLibraries: defaultSharedLibraries,
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

    await userRepository.save(user);

    // Sync with Plex if sharedLibraries changed and user has permissions to manage users
    if (
      req.user?.hasPermission(Permission.MANAGE_USERS) &&
      (previousSharedLibraries !== newSharedLibraries ||
        previousAllowDownloads !== newAllowDownloads ||
        previousAllowLiveTv !== newAllowLiveTv) &&
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

export default userSettingsRoutes;
