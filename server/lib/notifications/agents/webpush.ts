import { NotificationType } from '@server/constants/notification';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
  shouldSendAdminNotification,
} from '@server/lib/notifications';
import { getWebPushTransport } from '@server/lib/outboundProxy';
import { isSupportedPushEndpoint } from '@server/lib/pushSubscription';
import type { NotificationAgentConfig } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import webpush from 'web-push';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

const WEB_PUSH_REQUEST_TIMEOUT_MS = 10_000;
const WEB_PUSH_BATCH_SIZE = 20;

interface PushNotificationPayload {
  notificationType: string;
  subject: string;
  message?: string;
  image?: string;
  actionUrl?: string;
  actionUrlTitle?: string;
  isAdmin?: boolean;
}

interface WebPushError extends Error {
  statusCode?: number;
  status?: number;
}

class WebPushAgent
  extends BaseAgent<NotificationAgentConfig>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentConfig {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.webpush;
  }

  private getNotificationPayload(
    type: NotificationType,
    payload: NotificationPayload
  ): PushNotificationPayload {
    return {
      notificationType: NotificationType[type],
      subject: payload.subject,
      message: payload.message ?? '',
      image: payload.image,
      actionUrl: payload.actionUrl,
      actionUrlTitle: payload.actionUrlTitle,
      isAdmin: payload.isAdmin,
    };
  }

  public shouldSend(): boolean {
    return this.getSettings().enabled;
  }

  public async send(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<boolean> {
    const agentSettings = this.getSettings();
    if (!hasNotificationType(type, agentSettings.types ?? ALL_NOTIFICATIONS)) {
      return true;
    }

    const userRepository = getRepository(User);
    const userPushSubRepository = getRepository(UserPushSubscription);
    const settings = getSettings();

    const pushSubs: UserPushSubscription[] = [];

    const webPushNotification = async (
      pushSub: UserPushSubscription,
      notificationPayload: Buffer
    ) => {
      if (!isSupportedPushEndpoint(pushSub.endpoint)) {
        logger.warn('Skipping unsupported web push endpoint', {
          label: 'Notifications',
          subscriptionId: pushSub.id,
        });
        return;
      }

      logger.debug('Sending web push notification', {
        label: 'Notifications',
        recipient: pushSub.user.displayName,
        type: NotificationType[type],
        subject: payload.subject,
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: pushSub.endpoint,
            keys: { auth: pushSub.auth, p256dh: pushSub.p256dh },
          },
          notificationPayload,
          {
            timeout: WEB_PUSH_REQUEST_TIMEOUT_MS,
            ...getWebPushTransport(pushSub.endpoint),
          }
        );
      } catch (e) {
        const webPushError = e as WebPushError;
        const statusCode = webPushError.statusCode || webPushError.status;
        const isPermanentFailure = statusCode === 404 || statusCode === 410;

        logger.error(
          isPermanentFailure
            ? 'Error sending web push notification; removing invalid subscription'
            : 'Error sending web push notification (transient error, keeping subscription)',
          {
            label: 'Notifications',
            recipient: pushSub.user.displayName,
            type: NotificationType[type],
            subject: payload.subject,
            errorMessage: webPushError.message || String(e),
            statusCode: statusCode || 'unknown',
          }
        );

        if (isPermanentFailure) {
          await userPushSubRepository.remove(pushSub);
        }
      }
    };

    if (
      payload.notifyUser &&
      (!payload.notifyUser.settings ||
        payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.WEBPUSH,
          type
        ))
    ) {
      const notifySubs = await userPushSubRepository.find({
        where: { user: { id: payload.notifyUser.id } },
      });

      pushSubs.push(...notifySubs);
    }

    if (payload.notifyAdmin) {
      const users = await userRepository.find({
        relations: {
          settings: true,
        },
      });

      const manageUsers = users.filter(
        (user) =>
          (!user.settings ||
            user.settings.hasNotificationType(
              NotificationAgentKey.WEBPUSH,
              type
            )) &&
          shouldSendAdminNotification(type, user, payload)
      );

      const allSubs =
        manageUsers.length > 0
          ? await userPushSubRepository
              .createQueryBuilder('pushSub')
              .leftJoinAndSelect('pushSub.user', 'user')
              .where('pushSub.userId IN (:...users)', {
                users: manageUsers.map((user) => user.id),
              })
              .getMany()
          : [];

      pushSubs.push(...allSubs);
    }

    if (pushSubs.length > 0) {
      const adminUser = await userRepository.findOne({ where: { id: 1 } });
      const contactSubject = adminUser?.email
        ? `mailto:${adminUser.email}`
        : settings.main.applicationUrl?.startsWith('https://')
          ? settings.main.applicationUrl
          : 'mailto:noreply@streamarr.local';

      webpush.setVapidDetails(
        contactSubject,
        settings.vapidPublic,
        settings.vapidPrivate
      );

      const notificationPayload = Buffer.from(
        JSON.stringify(this.getNotificationPayload(type, payload)),
        'utf-8'
      );

      // Dedupe subscriptions so a user who is both the recipient and an admin
      // is only notified once per device.
      const uniqueSubs = [
        ...new Map(pushSubs.map((sub) => [sub.id, sub])).values(),
      ];

      for (
        let startIndex = 0;
        startIndex < uniqueSubs.length;
        startIndex += WEB_PUSH_BATCH_SIZE
      ) {
        const subscriptionBatch = uniqueSubs.slice(
          startIndex,
          startIndex + WEB_PUSH_BATCH_SIZE
        );
        await Promise.all(
          subscriptionBatch.map((sub) =>
            webPushNotification(sub, notificationPayload)
          )
        );
      }
    }

    return true;
  }
}

export default WebPushAgent;
