import PlexAPI, {
  PlexNotFoundError,
  type PlexMetadata,
} from '@server/api/plexapi';
import PlexTvAPI from '@server/api/plextv';
import SeerrAPI from '@server/api/seerr';
import TautulliAPI, { type TautulliHistoryRecord } from '@server/api/tautulli';
import TheMovieDb from '@server/api/themoviedb';
import { UserType } from '@server/constants/user';
import dataSource, { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import type {
  UserNotificationsResponse,
  QuotaResponse,
  UserInvitesResponse,
  UserResultsResponse,
  UserSummary,
} from '@server/interfaces/api/userInterfaces';
import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import { hasPermission, Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import type { EntityManager } from 'typeorm';
import { In, Not } from 'typeorm';
import userSettingsRoutes, { isOwnProfileOrAdmin } from './usersettings';
import userOnboardingRoutes from './onboarding';
import PreparedEmail from '@server/lib/email';
import path from 'path';
import crypto from 'crypto';
import Invite from '@server/entity/Invite';
import Notification from '@server/entity/Notification';
import { plexSync } from '@server/lib/plexSync';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const pageSize = req.query.take ? Number(req.query.take) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    let query = getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.settings', 'settings')
      .leftJoinAndSelect('user.redeemedInvite', 'redeemedInvite')
      .leftJoinAndSelect('redeemedInvite.createdBy', 'invitedBy');

    switch (req.query.sort) {
      case 'updated':
        query = query.orderBy('user.updatedAt', 'DESC');
        break;
      case 'displayname':
        query = query
          .addSelect(
            "CASE WHEN (user.username IS NULL OR user.username = '') THEN CASE WHEN (user.plexUsername IS NULL OR user.plexUsername = '') THEN LOWER(user.email) ELSE LOWER(user.plexUsername) END ELSE LOWER(user.username) END",
            'displayNameSort'
          )
          .orderBy('displayNameSort', 'ASC');
        break;
      case 'invites':
        query = query
          .addSelect((subQuery) => {
            return subQuery
              .select('COUNT(invite.id)', 'inviteCount')
              .from(Invite, 'invite')
              .where('invite.createdBy.id = user.id');
          }, 'inviteCount')
          .orderBy('inviteCount', 'DESC');
        break;
      default:
        query = query.orderBy('user.id', 'ASC');
        break;
    }

    const [users, userCount] = await (
      pageSize ? query.take(pageSize).skip(skip) : query
    ).getManyAndCount();

    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      const inviteCounts = await getRepository(Invite)
        .createQueryBuilder('invite')
        .select('invite.createdBy.id', 'userId')
        .addSelect('COUNT(invite.id)', 'count')
        .where('invite.createdBy.id IN (:...userIds)', { userIds })
        .groupBy('invite.createdBy.id')
        .getRawMany();

      const countMap = new Map(
        inviteCounts.map((r) => [r.userId, Number(r.count)])
      );
      users.forEach((user) => {
        user.inviteCount = countMap.get(user.id) ?? 0;
      });
    }

    res.status(200).json({
      pageInfo: {
        pages: pageSize ? Math.ceil(userCount / pageSize) : 1,
        pageSize: pageSize ?? userCount,
        results: userCount,
        page: pageSize ? Math.ceil(skip / pageSize) + 1 : 1,
      },
      results: User.filterMany(
        users,
        req.user?.hasPermission(Permission.MANAGE_USERS)
      ),
    } as UserResultsResponse);
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

router.post(
  '/',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    try {
      const settings = getSettings();

      const body = req.body;
      const userRepository = getRepository(User);

      const existingUser = await userRepository
        .createQueryBuilder('user')
        .where('user.email = :email', { email: body.email.toLowerCase() })
        .getOne();

      if (existingUser) {
        return next({
          status: 409,
          message: 'User already exists with submitted email.',
          errors: ['USER_EXISTS'],
        });
      }

      const passedExplicitPassword = body.password && body.password.length > 0;
      const avatar = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(body.email.trim().toLowerCase()).digest('hex')}?d=mm&s=200`;

      if (
        !passedExplicitPassword &&
        !settings.notifications.agents.email.enabled
      ) {
        throw new Error('Email notifications must be enabled');
      }

      const user = new User({
        avatar: body.avatar ?? avatar,
        username: body.username,
        email: body.email,
        password: body.password,
        permissions: settings.main.defaultPermissions,
        plexToken: '',
        userType: UserType.LOCAL,
      });

      let generatedPassword: string | undefined;
      if (passedExplicitPassword) {
        await user.setPassword(body.password);
      } else {
        generatedPassword = await user.generatePassword();
      }

      await userRepository.save(user);

      if (generatedPassword) {
        const { applicationTitle, applicationUrl, customLogo } =
          getSettings().main;
        const logoUrl = customLogo || '/logo_full.png';

        try {
          logger.info(`Sending generated password email for ${user.email}`, {
            label: 'User Management',
          });
          const email = new PreparedEmail(
            getSettings().notifications.agents.email
          );
          await email.send({
            template: path.join(
              __dirname,
              '../../templates/email/generatedpassword'
            ),
            message: { to: user.email },
            locals: {
              password: generatedPassword,
              applicationUrl,
              applicationTitle,
              recipientName: user.username,
              logoUrl,
            },
          });
        } catch (e) {
          logger.error('Failed to send out generated password email', {
            label: 'User Management',
            message: e.message,
          });
        }
      }
      res.status(201).json(user.filter());
    } catch (e) {
      logger.error('User creation failed', { error: e, stack: e.stack });
      next({ status: 500, message: e.message });
    }
  }
);

router.post<
  never,
  unknown,
  { endpoint: string; p256dh: string; auth: string; userAgent: string }
>('/registerPushSubscription', async (req, res, next) => {
  try {
    await dataSource.transaction(
      async (transactionalEntityManager: EntityManager) => {
        const transactionalRepo =
          transactionalEntityManager.getRepository(UserPushSubscription);

        const existingSubscription = await transactionalRepo.findOne({
          relations: { user: true },
          where: [
            { auth: req.body.auth, user: { id: req.user?.id } },
            { endpoint: req.body.endpoint, user: { id: req.user?.id } },
          ],
        });

        if (existingSubscription) {
          const updateSubscription = async (
            scenario: 'auth-rotated' | 'endpoint-rotated'
          ) => {
            if (scenario === 'auth-rotated') {
              existingSubscription.auth = req.body.auth;
            } else {
              existingSubscription.endpoint = req.body.endpoint;
            }

            existingSubscription.p256dh = req.body.p256dh;
            existingSubscription.userAgent = req.body.userAgent;

            await transactionalRepo.save(existingSubscription);

            const message =
              scenario === 'auth-rotated'
                ? 'Updated push subscription with new keys for same endpoint.'
                : 'Updated push subscription with new endpoint for same auth key.';

            logger.debug(message, { label: 'API' });
          };

          if (
            existingSubscription.endpoint === req.body.endpoint &&
            existingSubscription.auth !== req.body.auth
          ) {
            // Same endpoint, keys rotated — update auth/p256dh
            await updateSubscription('auth-rotated');
            return;
          }

          if (
            existingSubscription.auth === req.body.auth &&
            existingSubscription.endpoint !== req.body.endpoint
          ) {
            // Same auth key, endpoint URL rotated — update endpoint/p256dh
            await updateSubscription('endpoint-rotated');
            return;
          }

          logger.debug(
            'Duplicate subscription detected. Skipping registration.',
            {
              label: 'API',
            }
          );
          return;
        }

        if (req.body.userAgent) {
          const staleSubscriptions = await transactionalRepo.find({
            relations: { user: true },
            where: {
              userAgent: req.body.userAgent,
              user: { id: req.user?.id },
              endpoint: Not(req.body.endpoint),
            },
          });

          if (staleSubscriptions.length > 0) {
            await transactionalRepo.remove(staleSubscriptions);
            logger.debug(
              `Removed ${staleSubscriptions.length} stale push subscription(s) from same device.`,
              { label: 'API' }
            );
          }
        }

        const userPushSubscription = new UserPushSubscription({
          auth: req.body.auth,
          endpoint: req.body.endpoint,
          p256dh: req.body.p256dh,
          userAgent: req.body.userAgent,
          user: req.user,
        });

        await transactionalRepo.save(userPushSubscription);
      }
    );

    return res.status(204).send();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    logger.error('Failed to register user push subscription', { label: 'API' });
    next({ status: 500, message: 'Failed to register subscription.' });
  }
});

router.get<{ userId: number }>(
  '/:userId/pushSubscriptions',
  async (req, res, next) => {
    try {
      if (
        !req.user?.hasPermission(Permission.MANAGE_USERS) &&
        req.user?.id !== Number(req.params.userId)
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to view this user's subscriptions.",
        });
      }

      const userPushSubRepository = getRepository(UserPushSubscription);

      const userPushSubs = await userPushSubRepository.find({
        relations: { user: true },
        where: { user: { id: req.params.userId } },
      });

      res.status(200).json(userPushSubs);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      next({ status: 404, message: 'User subscriptions not found.' });
    }
  }
);

router.get<{ userId: number; key: string }>(
  '/:userId/pushSubscription/:key',
  async (req, res, next) => {
    try {
      if (
        !req.user?.hasPermission(Permission.MANAGE_USERS) &&
        req.user?.id !== Number(req.params.userId)
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to view this user's subscription.",
        });
      }

      const userPushSubRepository = getRepository(UserPushSubscription);

      const userPushSub = await userPushSubRepository.findOneOrFail({
        relations: { user: true },
        where: { user: { id: req.params.userId }, endpoint: req.params.key },
      });

      res.status(200).json(userPushSub);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      next({ status: 404, message: 'User subscription not found.' });
    }
  }
);

router.delete<{ userId: number; endpoint: string }>(
  '/:userId/pushSubscription/:endpoint',
  async (req, res, next) => {
    try {
      if (
        !req.user?.hasPermission(Permission.MANAGE_USERS) &&
        req.user?.id !== Number(req.params.userId)
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to delete this user's subscription.",
        });
      }

      const userPushSubRepository = getRepository(UserPushSubscription);

      const userPushSub = await userPushSubRepository.findOne({
        relations: { user: true },
        where: {
          user: { id: req.params.userId },
          endpoint: req.params.endpoint,
        },
      });

      if (!userPushSub) {
        return res.status(204).send();
      }

      await userPushSubRepository.remove(userPushSub);
      return res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting the user push subscription', {
        label: 'API',
        endpoint: req.params.endpoint,
        errorMessage: e.message,
      });
      return next({ status: 500, message: 'User push subscription not found' });
    }
  }
);

router.get<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
      relations: ['redeemedInvite', 'redeemedInvite.createdBy'],
    });

    const invites = await getRepository(Invite).find({
      where: { createdBy: { id: user.id } },
      relations: ['redeemedBy'],
    });

    const createdBySummary: UserSummary | null = user.redeemedInvite?.createdBy
      ? {
          id: user.redeemedInvite.createdBy.id,
          displayName: user.redeemedInvite.createdBy.displayName,
          avatar: user.redeemedInvite.createdBy.avatar,
        }
      : null;

    const response = {
      ...user.filter(req.user?.hasPermission(Permission.MANAGE_USERS)),
      inviteCount: invites.length,
      inviteCountRedeemed: invites.filter(
        (invite) => invite.redeemedBy && invite.redeemedBy.length > 0
      ).length,
      redeemedInvite: user.redeemedInvite
        ? { ...user.redeemedInvite, createdBy: createdBySummary }
        : null,
    };

    res.status(200).json(response);
  } catch {
    next({ status: 404, message: 'User not found.' });
  }
});

router.use('/:id/settings', userSettingsRoutes);
router.use('/:id/onboarding', isOwnProfileOrAdmin(), userOnboardingRoutes);

router.get<{ id: string }, UserInvitesResponse>(
  '/:id/invites',
  async (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    try {
      const user = await getRepository(User).findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (
        user.id !== req.user?.id &&
        !req.user?.hasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        )
      ) {
        return next({
          status: 403,
          message: "You do not have permission to view this user's invites.",
        });
      }

      const [invites, inviteCount] = await getRepository(Invite)
        .createQueryBuilder('invite')
        .leftJoinAndSelect('invite.updatedBy', 'updatedBy')
        .leftJoinAndSelect('invite.createdBy', 'createdBy')
        .leftJoinAndSelect('invite.redeemedBy', 'redeemedBy')
        .andWhere('createdBy.id = :id', {
          id: user.id,
        })
        .orderBy('invite.id', 'DESC')
        .take(pageSize)
        .skip(skip)
        .getManyAndCount();

      res.status(200).json({
        pageInfo: {
          pages: Math.ceil(inviteCount / pageSize),
          pageSize,
          results: inviteCount,
          page: Math.ceil(skip / pageSize) + 1,
        },
        results: invites,
      });
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

export const canMakePermissionsChange = (
  permissions: number,
  user?: User
): boolean =>
  // Only let the owner grant admin privileges
  !(hasPermission(Permission.ADMIN, permissions) && user?.id !== 1);

router.put<
  Record<string, never>,
  Partial<User>[],
  { ids: string[]; permissions: number }
>('/', isAuthenticated(Permission.MANAGE_USERS), async (req, res, next) => {
  try {
    const isOwner = req.user?.id === 1;

    if (!canMakePermissionsChange(req.body.permissions, req.user)) {
      return next({
        status: 403,
        message: 'You do not have permission to grant this level of access',
      });
    }

    const userRepository = getRepository(User);

    const users: User[] = await userRepository.find({
      where: {
        id: In(
          isOwner ? req.body.ids : req.body.ids.filter((id) => Number(id) !== 1)
        ),
      },
    });

    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        return userRepository.save(<User>{
          ...user,
          ...{ permissions: req.body.permissions },
        });
      })
    );

    res.status(200).json(updatedUsers);
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

router.put<{ id: string }>(
  '/:id',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    try {
      const userRepository = getRepository(User);

      const user = await userRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      // Only let the owner user modify themselves
      if (user.id === 1 && req.user?.id !== 1) {
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

      Object.assign(user, {
        username: req.body.username,
        permissions: req.body.permissions,
      });

      await userRepository.save(user);

      res.status(200).json(user.filter());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      next({ status: 404, message: 'User not found.' });
    }
  }
);

router.delete<{ id: string }>(
  '/:id',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    try {
      const userRepository = getRepository(User);

      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (user.id === 1) {
        return next({
          status: 405,
          message: 'This account cannot be deleted.',
        });
      }

      if (user.hasPermission(Permission.ADMIN) && req.user?.id !== 1) {
        return next({
          status: 405,
          message: 'You cannot delete users with administrative privileges.',
        });
      }

      // Before deleting the user, remove them from any invite redeemedBy arrays
      const inviteRepository = getRepository(Invite);
      const invites = await inviteRepository
        .createQueryBuilder('invite')
        .leftJoinAndSelect('invite.redeemedBy', 'redeemedBy')
        .where('redeemedBy.id = :userId', { userId: user.id })
        .getMany();

      for (const invite of invites) {
        // Remove user from redeemedBy array but keep the invite and its status
        // We don't decrease uses count since the invite was legitimately used
        invite.redeemedBy = invite.redeemedBy.filter((u) => u.id !== user.id);
        await inviteRepository.save(invite);
      }

      await userRepository.delete(user.id);
      res.status(200).json(user.filter());
    } catch (e) {
      logger.error('Something went wrong deleting a user', {
        label: 'API',
        userId: req.params.id,
        errorMessage: e.message,
      });
      return next({
        status: 500,
        message: 'Something went wrong deleting the user',
      });
    }
  }
);

router.post(
  '/import-from-plex',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    try {
      const settings = getSettings();
      const userRepository = getRepository(User);
      const body = req.body as { plexIds: string[] } | undefined;

      // taken from auth.ts
      const mainUser = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });
      const mainPlexTv = new PlexTvAPI(mainUser.plexToken ?? '');

      const plexUsersResponse = await mainPlexTv.getUsers();
      const createdUsers: User[] = [];
      for (const rawUser of plexUsersResponse.MediaContainer.User) {
        const account = rawUser.$;

        if (account.email) {
          const user = await userRepository
            .createQueryBuilder('user')
            .where('user.plexId = :id', { id: account.id })
            .orWhere('user.email = :email', {
              email: account.email.toLowerCase(),
            })
            .getOne();

          if (user) {
            // Update the user's avatar with their Plex thumbnail, in case it changed
            user.avatar = account.thumb;
            user.email = account.email;
            user.plexUsername = account.username;

            // In case the user was previously a local account
            if (user.userType === UserType.LOCAL) {
              user.userType = UserType.PLEX;
              user.plexId = parseInt(account.id);
            }
            await userRepository.save(user);
          } else if (!body || body.plexIds.includes(account.id)) {
            if (await mainPlexTv.checkUserAccess(parseInt(account.id))) {
              const newUser = new User({
                plexUsername: account.username,
                email: account.email,
                permissions: settings.main.defaultPermissions,
                plexId: parseInt(account.id),
                plexToken: '',
                avatar: account.thumb,
                userType: UserType.PLEX,
              });
              await userRepository.save(newUser);
              createdUsers.push(newUser);
            }
          }
        }
      }

      res.status(201).json(User.filterMany(createdUsers));
    } catch (e) {
      next({ status: 500, message: e.message });
    }
  }
);

router.get<{ id: string }, QuotaResponse>(
  '/:id/quota',
  async (req, res, next) => {
    try {
      const userRepository = getRepository(User);

      if (
        Number(req.params.id) !== req.user?.id &&
        !req.user?.hasPermission(
          [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
          { type: 'and' }
        )
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to view this user's invite limits.",
        });
      }

      const user = await userRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      const quotas = await user.getQuota();

      res.status(200).json(quotas);
    } catch (e) {
      next({ status: 404, message: e.message });
    }
  }
);

router.get<{ id: string }, UserNotificationsResponse>(
  '/:id/notifications',
  async (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    try {
      const user = await getRepository(User).findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (
        Number(req.params.id) !== req.user?.id &&
        !req.user?.hasPermission(
          [Permission.MANAGE_USERS, Permission.MANAGE_NOTIFICATIONS],
          { type: 'and' }
        )
      ) {
        return next({
          status: 403,
          message:
            'You do not have permission to view this users notifications',
        });
      }

      let isReadFilter: boolean[];

      switch (req.query.filter) {
        case 'unread':
          isReadFilter = [false];
          break;
        case 'read':
          isReadFilter = [true];
          break;
        default:
          isReadFilter = [true, false];
          break;
      }

      const [notifications, notificationCount] = await getRepository(
        Notification
      )
        .createQueryBuilder('notification')
        .leftJoinAndSelect('notification.notifyUser', 'user')
        .leftJoinAndSelect('notification.createdBy', 'createdBy')
        .leftJoinAndSelect('notification.updatedBy', 'updatedBy')
        .where('user.id = :id', { id: user.id })
        .andWhere('notification.isRead IN (:...isRead)', {
          isRead: isReadFilter,
        })
        .orderBy('notification.createdAt', 'DESC')
        .take(pageSize)
        .skip(skip)
        .getManyAndCount();

      res.status(200).json({
        pageInfo: {
          pages: Math.ceil(notificationCount / pageSize),
          pageSize,
          results: notificationCount,
          page: Math.ceil(skip / pageSize) + 1,
        },
        results: notifications,
      });
    } catch (e) {
      next({ status: 404, message: e.message });
    }
  }
);

router.put<
  { userId: string; notificationId: string },
  Notification,
  Notification
>('/:userId/notifications/:notificationId', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);
    const notificationRepository = getRepository(Notification);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.userId) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found.' });
    }

    if (
      user.id !== req.user?.id &&
      !req.user?.hasPermission(Permission.MANAGE_USERS)
    ) {
      return next({
        status: 403,
        message:
          "You do not have permission to update this user's notifications.",
      });
    }

    const notification = await notificationRepository.findOneOrFail({
      where: { id: Number(req.params.notificationId) },
      relations: ['createdBy', 'updatedBy', 'notifyUser'],
    });

    if (!notification) {
      return next({ status: 404, message: 'Notification not found.' });
    }
    notificationRepository.merge(notification, req.body);
    const updatedNotification = await notificationRepository.save(notification);

    const io = req.app.get('io');
    if (io) {
      await io.to(String(req.params.userId)).emit('newNotification', {
        id: notification.id,
        isRead: notification.isRead,
        action: 'updated',
      });
    }

    res.status(200).json(updatedNotification);
  } catch (e) {
    next({ status: 404, message: e.message });
  }
});

router.put<
  { userId: string },
  Notification[],
  Partial<Notification> & { notificationIds?: number[] }
>('/:userId/notifications', async (req, res, next) => {
  try {
    const userRepository = getRepository(User);
    const notificationRepository = getRepository(Notification);

    const user = await userRepository.findOneOrFail({
      where: { id: Number(req.params.userId) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found.' });
    }

    // Extract notificationIds from request body
    const { notificationIds, ...notificationUpdates } = req.body;

    // Check if only updating isRead property
    const isOnlyReadStatusUpdate =
      Object.keys(notificationUpdates).length === 1 &&
      'isRead' in notificationUpdates;

    // Basic permission: user can update their own notifications, or admin can update any
    if (
      user.id !== req.user?.id &&
      !req.user?.hasPermission(
        [Permission.MANAGE_NOTIFICATIONS, Permission.MANAGE_USERS],
        { type: 'and' }
      )
    ) {
      return next({
        status: 403,
        message:
          "You do not have permission to update this user's notifications.",
      });
    }

    // Enhanced permission: for non-isRead updates, require notification management permissions
    if (!isOnlyReadStatusUpdate) {
      if (
        !req.user?.hasPermission(
          [Permission.CREATE_NOTIFICATIONS, Permission.MANAGE_NOTIFICATIONS],
          { type: 'or' }
        )
      ) {
        return next({
          status: 403,
          message:
            'You do not have permission to modify notification properties other than read status.',
        });
      }
    }

    // Build query based on whether specific notification IDs are provided
    const whereCondition: {
      notifyUser: { id: number };
      id?: ReturnType<typeof In>;
    } = {
      notifyUser: { id: user.id },
    };

    if (notificationIds && notificationIds.length > 0) {
      // Update specific notifications by ID
      whereCondition.id = In(notificationIds);
    }
    // If no notificationIds provided, update ALL user's notifications (no additional filter)
    const notifications = await notificationRepository.find({
      where: whereCondition,
      relations: ['createdBy', 'updatedBy', 'notifyUser'],
    });

    // Validate that all requested notification IDs belong to the user
    if (
      notificationIds &&
      notificationIds.length > 0 &&
      notifications.length !== notificationIds.length
    ) {
      return next({
        status: 404,
        message:
          'One or more notification IDs not found or do not belong to this user.',
      });
    }

    const updatedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        notificationRepository.merge(notification, notificationUpdates);
        return notificationRepository.save(notification);
      })
    );

    const io = req.app.get('io');
    if (io) {
      await io.to(String(req.params.userId)).emit('newNotification', {
        action: 'bulkUpdated',
      });
    }

    res.status(200).json(updatedNotifications);
  } catch (e) {
    logger.error('Something went wrong updating user notifications', {
      label: 'API',
      userId: req.params.userId,
      notificationIds: req.body.notificationIds,
      errorMessage: e.message,
    });
    next({
      status: 500,
      message: 'Something went wrong updating the notifications',
    });
  }
});

router.delete<{ userId: string; notificationId: string }>(
  '/:userId/notifications/:notificationId',
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const notificationRepository = getRepository(Notification);

    try {
      const user = await userRepository.findOneOrFail({
        where: { id: Number(req.params.userId) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (
        user.id !== req.user?.id &&
        !req.user?.hasPermission(Permission.MANAGE_USERS)
      ) {
        return next({
          status: 403,
          message:
            "You do not have permission to delete this user's notifications.",
        });
      }

      const notification = await notificationRepository.findOneOrFail({
        where: { id: Number(req.params.notificationId) },
      });

      await notificationRepository.remove(notification);

      const io = req.app.get('io');
      if (io) {
        await io.to(String(req.params.userId)).emit('newNotification', {
          id: notification.id,
          action: 'deleted',
        });
      }

      res.status(204).send();
    } catch (e) {
      logger.debug('Something went wrong deleting the notification', {
        label: 'Notifications',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Notification not found' });
    }
  }
);

router.get('/:id/plex/libraries', isAuthenticated(), async (req, res, next) => {
  if (
    !req.user?.hasPermission(Permission.MANAGE_USERS) &&
    req.user?.id !== Number(req.params.id)
  ) {
    return next({
      status: 403,
      message: "You do not have permission to view this user's Plex libraries.",
    });
  }

  const userRepository = getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      return next({ status: 404, message: 'User not found.' });
    }

    if (user.userType !== UserType.PLEX || user.id === 1) {
      res.status(200).json({
        currentPlexLibraries: null,
        canFetchFromPlex: false,
      });
      return;
    }

    try {
      const plexData = await plexSync.getCurrentPlexLibraries(user);

      res.status(200).json({
        currentPlexLibraries:
          plexData.libraries.length > 0 ? plexData.libraries.join('|') : '',
        canFetchFromPlex: true,
        permissions: plexData.permissions,
      });
    } catch (error) {
      logger.warn(
        `Could not fetch current Plex libraries for user ${user.email}`,
        {
          label: 'Plex Sync',
          userId: user.id,
          error: error.message,
        }
      );
      res.status(200).json({
        currentPlexLibraries: null,
        canFetchFromPlex: true,
        error: error.message,
      });
    }
  } catch (e) {
    next({ status: 500, message: e.message });
  }
});

router.get<{ id: string }>(
  '/:id/requests',
  isAuthenticated(),
  async (req, res, next) => {
    const seerrSettings = getSettings().overseerr;

    if (!seerrSettings.enabled || !seerrSettings.hostname) {
      return res.status(404).json({ message: 'Seerr is not configured.' });
    }

    if (
      Number(req.params.id) !== req.user?.id &&
      !req.user?.hasPermission(Permission.MANAGE_USERS)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to view this user's requests.",
      });
    }

    const parsedTake = Number(String(req.query.take ?? ''));
    const take =
      Number.isFinite(parsedTake) && parsedTake > 0
        ? Math.min(Math.floor(parsedTake), 100)
        : 10;
    const parsedSkip = Number(String(req.query.skip ?? ''));
    const skip =
      Number.isFinite(parsedSkip) && parsedSkip >= 0
        ? Math.floor(parsedSkip)
        : 0;

    try {
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (!user.plexId) {
        return res.status(200).json({
          pageInfo: { pages: 0, pageSize: take, results: 0, page: 1 },
          results: [],
        });
      }

      const seerrApi = new SeerrAPI(seerrSettings);
      const requests = await seerrApi.getRequestsByPlexId(
        user.plexId,
        take,
        skip
      );

      res.status(200).json(requests);
    } catch (e) {
      logger.error('Something went wrong fetching user requests from Seerr', {
        label: 'API',
        userId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Failed to fetch user requests.' });
    }
  }
);

router.get<{ id: string }>(
  '/:id/watched',
  isAuthenticated(),
  async (req, res, next) => {
    const settings = getSettings();

    if (
      Number(req.params.id) !== req.user?.id &&
      !req.user?.hasPermission(Permission.MANAGE_USERS)
    ) {
      return next({
        status: 403,
        message:
          "You do not have permission to view this user's watch history.",
      });
    }

    if (!settings.tautulli.hostname || !settings.tautulli.apiKey) {
      return res.status(200).json({ results: [] });
    }

    const parsedTake = Number(String(req.query.take ?? ''));
    const take =
      Number.isFinite(parsedTake) && parsedTake > 0
        ? Math.min(Math.floor(parsedTake), 100)
        : 20;
    const parsedSkip = Number(String(req.query.skip ?? ''));
    const skip =
      Number.isFinite(parsedSkip) && parsedSkip >= 0
        ? Math.floor(parsedSkip)
        : 0;

    try {
      const userRepository = getRepository(User);
      const user = await userRepository.findOne({
        where: { id: Number(req.params.id) },
      });

      if (!user) {
        return next({ status: 404, message: 'User not found.' });
      }

      if (!user.plexId) {
        return res.status(200).json({ results: [] });
      }

      const tautulli = new TautulliAPI(settings.tautulli);
      let history: TautulliHistoryRecord[];
      try {
        history = await tautulli.getUserWatchHistory(user, { take, skip });
      } catch {
        return res.status(200).json({ results: [] });
      }
      const machineId = settings.plex.machineId;

      const showKey = (r: {
        grandparentRatingKey?: number | null;
        ratingKey: number;
      }) =>
        r.grandparentRatingKey
          ? String(r.grandparentRatingKey)
          : String(r.ratingKey);

      const showKeyToRecord = new Map<string, TautulliHistoryRecord>();
      const results = history.map((record) => {
        const sKey = record.grandparent_rating_key
          ? String(record.grandparent_rating_key)
          : String(record.rating_key);
        if (!showKeyToRecord.has(sKey)) showKeyToRecord.set(sKey, record);
        return {
          ratingKey: record.rating_key,
          grandparentRatingKey: record.grandparent_rating_key || null,
          title: record.title,
          grandparentTitle: record.grandparent_title || null,
          mediaType: record.media_type as 'movie' | 'episode',
          thumb: record.grandparent_rating_key
            ? `/library/metadata/${record.grandparent_rating_key}/thumb`
            : record.thumb || null,
          summary: null as string | null,
          posterPath: null as string | null,
          backdropPath: null as string | null,
          percentComplete: record.percent_complete,
          plexUrl: machineId
            ? `/watch/web/index.html#!/server/${machineId}/details?key=/library/metadata/${record.rating_key}`
            : null,
          deletedFromPlex: false,
          plexThumbReliable: true,
        };
      });

      try {
        const adminPlexToken = await getAdminPlexToken();

        if (adminPlexToken) {
          const plexApi = new PlexAPI({ plexToken: adminPlexToken });
          const tmdb = new TheMovieDb();
          const uniqueKeys = Array.from(new Set(results.map(showKey)));

          const summaryMap = new Map<string, string>();
          const posterMap = new Map<string, string>();
          const backdropMap = new Map<string, string>();
          const deletedKeys = new Set<string>();
          const rekeyedMap = new Map<string, string>();

          const normalizeTitle = (t: string) =>
            t
              .normalize('NFC')
              .replace(/\s*\(\d{4}\)\s*/g, ' ')
              .replace(/[:\-–—]/g, ' ')
              .replace(/[^\w\s]/g, '')
              .replace(/\s+/g, ' ')
              .trim();

          const recoverByGuid = async (
            record: TautulliHistoryRecord,
            currentKey: string
          ): Promise<
            { meta: PlexMetadata; newKey: string } | 'same-key' | null
          > => {
            if (!record.guid) return null;
            const guidItem = await plexApi.searchByGuid(record.guid);
            if (!guidItem) return null;
            const newKey =
              record.media_type === 'episode'
                ? guidItem.grandparentRatingKey
                : guidItem.ratingKey;
            if (!newKey) return null;
            if (newKey === currentKey) return 'same-key';
            try {
              const recoveredMeta = await plexApi.getMetadata(newKey);
              return { meta: recoveredMeta, newKey };
            } catch {
              return null;
            }
          };

          await Promise.allSettled(
            uniqueKeys.map(async (key) => {
              let meta: PlexMetadata | null = null;
              let activeKey = key;
              const record = showKeyToRecord.get(key);

              try {
                meta = await plexApi.getMetadata(key);
              } catch (e) {
                if (e instanceof PlexNotFoundError) {
                  if (record) {
                    const recovery = await recoverByGuid(record, key);
                    if (recovery && recovery !== 'same-key') {
                      meta = recovery.meta;
                      activeKey = recovery.newKey;
                      rekeyedMap.set(key, recovery.newKey);
                    } else {
                      deletedKeys.add(key);
                    }
                  } else {
                    deletedKeys.add(key);
                  }
                } else {
                  logger.warn(
                    'Plex metadata lookup failed for watch history item; skipping deletion check',
                    {
                      label: 'API',
                      key,
                      errorMessage: e instanceof Error ? e.message : String(e),
                    }
                  );
                }
              }

              if (meta && record) {
                const expected =
                  record.media_type === 'movie'
                    ? record.title?.toLowerCase().trim()
                    : record.grandparent_title?.toLowerCase().trim();
                const actual = meta.title?.toLowerCase().trim();

                if (
                  expected &&
                  actual &&
                  normalizeTitle(expected) !== normalizeTitle(actual)
                ) {
                  const recovery = await recoverByGuid(record, activeKey);
                  if (recovery && recovery !== 'same-key') {
                    meta = recovery.meta;
                    rekeyedMap.set(key, recovery.newKey);
                  } else if (!recovery) {
                    deletedKeys.add(key);
                    meta = null;
                  }
                }
              }

              let tmdbDetails: {
                poster_path?: string | null;
                backdrop_path?: string | null;
                overview?: string | null;
              } | null = null;

              if (record) {
                try {
                  const isEpisode = record.media_type === 'episode';
                  const searchTitle = isEpisode
                    ? record.grandparent_title || record.title
                    : record.title;
                  const searchResult = isEpisode
                    ? await tmdb.searchTvShows({ query: searchTitle })
                    : await tmdb.searchMovies({ query: searchTitle });
                  if (searchResult.results.length) {
                    const normalizedSearch = searchTitle.trim().toLowerCase();
                    const exactMatch = searchResult.results.find(
                      (r) =>
                        (r as { title?: string; name?: string }).title
                          ?.trim()
                          .toLowerCase() === normalizedSearch ||
                        (r as { title?: string; name?: string }).name
                          ?.trim()
                          .toLowerCase() === normalizedSearch
                    );
                    tmdbDetails = exactMatch ?? searchResult.results[0];
                  }
                } catch {
                  // Title search is best-effort
                }
              }

              if (tmdbDetails?.overview)
                summaryMap.set(key, tmdbDetails.overview);
              else if (meta?.summary) summaryMap.set(key, meta.summary);

              if (tmdbDetails?.poster_path)
                posterMap.set(key, tmdbDetails.poster_path);
              if (tmdbDetails?.backdrop_path)
                backdropMap.set(key, tmdbDetails.backdrop_path);
            })
          );

          for (const result of results) {
            const key = showKey(result);
            result.summary = summaryMap.get(key) ?? null;
            result.posterPath = posterMap.get(key) ?? null;
            result.backdropPath = backdropMap.get(key) ?? null;
            result.deletedFromPlex = deletedKeys.has(key);
            result.plexThumbReliable =
              !result.deletedFromPlex && !rekeyedMap.has(key);

            if (result.deletedFromPlex) {
              result.plexUrl = null;
            } else if (rekeyedMap.has(key) && machineId) {
              const newKey = rekeyedMap.get(key)!;
              result.plexUrl = `/watch/web/index.html#!/server/${machineId}/details?key=/library/metadata/${newKey}`;
              result.thumb = `/library/metadata/${newKey}/thumb`;
            }
          }
        }
      } catch (e) {
        logger.debug(
          'Something went wrong fetching plex metadata for watch history',
          {
            label: 'API',
            errorMessage: e instanceof Error ? e.message : String(e),
          }
        );
      }

      return res.status(200).json({ results });
    } catch (e) {
      logger.error('Something went wrong fetching user watch history', {
        label: 'API',
        userId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Failed to fetch watch history.' });
    }
  }
);

export default router;
