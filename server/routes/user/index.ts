import PlexTvAPI from '@server/api/plextv';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import type {
  UserNotificationsResponse,
  QuotaResponse,
  UserInvitesResponse,
  UserResultsResponse,
} from '@server/interfaces/api/userInterfaces';
import { hasPermission, Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import { In } from 'typeorm';
import userSettingsRoutes from './usersettings';
import PreparedEmail from '@server/lib/email';
import path from 'path';
import crypto from 'crypto';
import Invite from '@server/entity/Invite';
import Notification from '@server/entity/Notification';
import { plexSync } from '@server/lib/plexSync';

// Type for partial user data returned in invite responses
type InviteCreatorSummary = Pick<User, 'id' | 'displayName' | 'avatar'>;
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
    const userPushSubRepository = getRepository(UserPushSubscription);

    const existingSubs = await userPushSubRepository.find({
      relations: { user: true },
      where: { auth: req.body.auth, user: { id: req.user?.id } },
    });

    if (existingSubs.length > 0) {
      logger.debug(
        'User push subscription already exists. Skipping registration.',
        { label: 'API' }
      );
      res.status(204).send();
    }

    const userPushSubscription = new UserPushSubscription({
      auth: req.body.auth,
      endpoint: req.body.endpoint,
      p256dh: req.body.p256dh,
      userAgent: req.body.userAgent,
      user: req.user,
    });

    userPushSubRepository.save(userPushSubscription);

    res.status(204).send();
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
      const userPushSubRepository = getRepository(UserPushSubscription);

      const userPushSub = await userPushSubRepository.findOneOrFail({
        relations: { user: true },
        where: { user: { id: req.params.userId }, p256dh: req.params.key },
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
      const userPushSubRepository = getRepository(UserPushSubscription);

      const userPushSub = await userPushSubRepository.findOneOrFail({
        relations: { user: true },
        where: {
          user: { id: req.params.userId },
          endpoint: req.params.endpoint,
        },
      });

      await userPushSubRepository.remove(userPushSub);
      res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting the user push subcription', {
        label: 'API',
        endpoint: req.params.endpoint,
        errorMessage: e.message,
      });
      return next({ status: 500, message: 'User push subcription not found' });
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
    user.inviteCount = invites.length;
    user.inviteCountRedeemed = invites.filter(
      (invite) => invite.redeemedBy && invite.redeemedBy.length > 0
    ).length;

    if (user.redeemedInvite?.createdBy) {
      const { id, displayName, avatar } = user.redeemedInvite.createdBy;
      // Reduce response size by only including necessary user fields
      user.redeemedInvite.createdBy = {
        id,
        displayName,
        avatar,
      } as InviteCreatorSummary as User;
    }

    res
      .status(200)
      .json(user.filter(req.user?.hasPermission(Permission.MANAGE_USERS)));
  } catch {
    next({ status: 404, message: 'User not found.' });
  }
});

router.use('/:id/settings', userSettingsRoutes);

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

export default router;
