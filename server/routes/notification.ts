import { getRepository } from '@server/datasource';
import Notification from '@server/entity/Notification';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import { Permission } from '@server/lib/permissions';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import type { NotificationSeverity } from '@server/constants/notification';
import { NotificationType } from '@server/constants/notification';
import { User } from '@server/entity/User';
import logger from '@server/logger';
import notificationManager, {
  hasNotificationType,
} from '@server/lib/notifications';

const notificationRoutes = Router();

notificationRoutes.get<Record<string, string>, NotificationResultsResponse>(
  '/',
  isAuthenticated(
    [Permission.MANAGE_NOTIFICATIONS, Permission.CREATE_NOTIFICATIONS],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 10;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const createdBy = req.query.createdBy ? Number(req.query.createdBy) : null;

    let sortFilter: string;

    switch (req.query.sort) {
      case 'modified':
        sortFilter = 'notification.updatedAt';
        break;
      default:
        sortFilter = 'notification.createdAt';
    }

    let typeFilter: NotificationType[];

    switch (req.query.type) {
      case 'test':
        typeFilter = [NotificationType.TEST_NOTIFICATION];
        break;
      case 'none':
        typeFilter = [NotificationType.NONE];
        break;
      default:
        typeFilter = [
          NotificationType.TEST_NOTIFICATION,
          NotificationType.NONE,
        ];
    }

    let isReadFilter: boolean[];

    switch (req.query.filter) {
      case 'read':
        isReadFilter = [true];
        break;
      case 'unread':
        isReadFilter = [false];
        break;
      default:
        isReadFilter = [true, false];
    }

    let query = getRepository(Notification)
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.createdBy', 'createdBy')
      .leftJoinAndSelect('notification.updatedBy', 'updatedBy')
      .where('notification.type IN (:...notificationType)', {
        notificationType: typeFilter,
      })
      .andWhere('notification.isRead IN (:...isRead)', {
        isRead: isReadFilter,
      });

    if (!req.user?.hasPermission(Permission.MANAGE_NOTIFICATIONS)) {
      if (createdBy && createdBy !== req.user?.id) {
        return next({
          status: 403,
          message:
            'You do not have permission to manage notifications sent by other users',
        });
      }
      query = query.andWhere('createdBy.id = :id', { id: req.user?.id });
    } else if (createdBy) {
      query = query.andWhere('createdBy.id = :id', { id: createdBy });
    }

    const [notifications, notificationCount] = await query
      .orderBy(sortFilter, 'DESC')
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
  }
);

interface NotificationCreationResult {
  success: boolean;
  userId: number;
  error?: string;
}

notificationRoutes.post<
  Record<string, string>,
  NotificationCreationResult | NotificationCreationResult[],
  {
    type: NotificationType;
    severity: NotificationSeverity;
    subject: string;
    message: string;
    notifyUser: number | number[];
    actionUrl: string;
    actionUrlTitle: string;
  }
>(
  '/',
  isAuthenticated(
    [Permission.MANAGE_NOTIFICATIONS, Permission.CREATE_NOTIFICATIONS],
    { type: 'or' }
  ),
  async (req, res, next) => {
    if (!req.user || !req.body.notifyUser) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    logger.debug('Creating notification', {
      label: 'Notifications',
      type: req.body.type,
      subject: req.body.subject,
      notifyUserIsArray: Array.isArray(req.body.notifyUser),
      notifyUserLength: Array.isArray(req.body.notifyUser)
        ? req.body.notifyUser.length
        : 1,
    });

    const userRepository = getRepository(User);

    // Fetch user entities from the database
    const userIds = Array.isArray(req.body.notifyUser)
      ? req.body.notifyUser
      : [req.body.notifyUser];

    const users = await userRepository.find({
      where: userIds.map((id) => ({ id })),
    });

    if (users.length === 0) {
      return next({
        status: 400,
        message: 'No valid users found to notify.',
      });
    }

    // Fetch user settings separately for validation (don't attach to user entities)
    const userSettingsMap = new Map();
    for (const user of users) {
      const userWithSettings = await userRepository.findOne({
        where: { id: user.id },
        relations: ['settings'],
      });
      if (userWithSettings?.settings) {
        userSettingsMap.set(user.id, userWithSettings.settings);
      }
    }

    if (!Array.isArray(req.body.notifyUser)) {
      const notifyUser = users[0];
      const settings = userSettingsMap.get(notifyUser.id);
      if (
        settings &&
        !hasNotificationType(
          req.body.type,
          settings.notificationTypes?.inApp ?? 0
        ) &&
        !hasNotificationType(
          req.body.type,
          settings.notificationTypes?.email ?? 0
        ) &&
        !hasNotificationType(
          req.body.type,
          settings.notificationTypes?.webpush ?? 0
        )
      ) {
        logger.debug('User has disabled notification type', {
          label: 'Notifications',
          userId: notifyUser.id,
          type: req.body.type,
        });
        return next({
          status: 400,
          message: 'User has disabled this notification type.',
        });
      }

      try {
        // Create minimal user object without entity methods to avoid serialization issues
        const minimalNotifyUser = {
          id: notifyUser.id,
          displayName: notifyUser.displayName,
          email: notifyUser.email,
        } as User;

        const payload = {
          notificationType: NotificationType[req.body.type],
          type: req.body.type,
          severity: req.body.severity,
          subject: req.body.subject,
          message: req.body.message,
          actionUrl: req.body.actionUrl,
          actionUrlTitle: req.body.actionUrlTitle,
          notifyUser: minimalNotifyUser,
          createdBy: { id: req.user.id } as User,
          updatedBy: { id: req.user.id } as User,
          notifySystem: false,
          notifyAdmin: false,
        };

        notificationManager.sendNotification(req.body.type, payload);
        res.status(201).json({ success: true, userId: notifyUser.id });
      } catch (e) {
        logger.debug('Error creating notification', {
          label: 'Notifications',
          errorMessage: e.message,
        });
        next({ status: 500, message: 'Error creating notification' });
      }
    } else {
      const createdNotifications: NotificationCreationResult[] = [];
      await Promise.all(
        users
          .filter((user) => {
            const settings = userSettingsMap.get(user.id);
            return (
              (!settings ||
                // Check if user has local notifications enabled and fallback to true if undefined
                // since local should default to true
                hasNotificationType(
                  req.body.type,
                  settings?.notificationTypes?.email ?? 0
                ) ||
                hasNotificationType(
                  req.body.type,
                  settings?.notificationTypes?.webpush ?? 0
                ) ||
                hasNotificationType(
                  req.body.type,
                  settings?.notificationTypes?.inApp ?? 0
                )) ??
              true
            );
          })
          .map(async (user) => {
            try {
              // Create minimal user object without entity methods to avoid serialization issues
              const minimalNotifyUser = {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
              } as User;

              const payload = {
                notificationType: NotificationType[req.body.type],
                type: req.body.type,
                severity: req.body.severity,
                subject: req.body.subject,
                message: req.body.message,
                notifyUser: minimalNotifyUser,
                actionUrl: req.body.actionUrl,
                actionUrlTitle: req.body.actionUrlTitle,
                createdBy: { id: req.user.id } as User,
                updatedBy: { id: req.user.id } as User,
                notifySystem: false,
                notifyAdmin: false,
              };

              notificationManager.sendNotification(req.body.type, payload);
              createdNotifications.push({ success: true, userId: user.id });
            } catch (e) {
              logger.error('Error creating notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: NotificationType[req.body.type],
                subject: req.body.subject,
                errorMessage: e.message,
              });
              createdNotifications.push({
                success: false,
                userId: user.id,
                error: e.message,
              });
            }
          })
      );

      res.status(201).json(createdNotifications);
    }
  }
);

notificationRoutes.put<{ id: string }, Notification, Notification>(
  '/:id',
  isAuthenticated(
    [Permission.MANAGE_NOTIFICATIONS, Permission.CREATE_NOTIFICATIONS],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const notificationRepository = getRepository(Notification);

    try {
      const notification = await notificationRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_NOTIFICATIONS) &&
        notification.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 403,
          message:
            'You do not have permission to modify notifications created by other users',
        });
      }
      notificationRepository.merge(notification, req.body);
      const updatedNotification =
        await notificationRepository.save(notification);

      const io = req.app.get('io');
      if (io) {
        await io
          .to(String(notification.notifyUser.id))
          .emit('newNotification', {
            id: notification.id,
            isRead: notification.isRead,
            action: 'updated',
          });
      }

      res.status(200).json(updatedNotification);
    } catch (e) {
      logger.debug('Something went wrong saving notification', {
        label: 'Notification',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Notification not found' });
    }
  }
);

notificationRoutes.delete<{ id: string }>(
  '/:id',
  isAuthenticated(
    [Permission.MANAGE_NOTIFICATIONS, Permission.CREATE_NOTIFICATIONS],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const notificationRepository = getRepository(Notification);

    try {
      const notification = await notificationRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
        relations: { createdBy: true },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_NOTIFICATIONS) &&
        notification.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 403,
          message:
            'You do not have permission to delete notifications created by other users',
        });
      }

      await notificationRepository.remove(notification);
      const io = req.app.get('io');
      if (io) {
        await io
          .to(String(notification.notifyUser.id))
          .emit('newNotification', {
            id: notification.id,
            action: 'deleted',
          });
      }

      res.status(204).send();
    } catch (e) {
      logger.debug('Something went wrong deleting notification', {
        label: 'Notification',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Notification not found' });
    }
  }
);

export default notificationRoutes;
