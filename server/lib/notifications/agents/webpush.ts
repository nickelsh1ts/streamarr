import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import type { NotificationAgentConfig } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import webpush from 'web-push';
import { Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

interface PushNotificationPayload {
  notificationType: string;
  subject: string;
  message?: string;
  image?: string;
  actionUrl?: string;
  actionUrlTitle?: string;
  requestId?: number;
  pendingRequestsCount?: number;
  isAdmin?: boolean;
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
    type: Notification,
    payload: NotificationPayload
  ): PushNotificationPayload {
    let message: string | undefined;
    switch (type) {
      case Notification.TEST_NOTIFICATION:
        message = payload.message;
        break;
      default:
        return { notificationType: Notification[type], subject: 'Unknown' };
    }

    return {
      notificationType: Notification[type],
      subject: payload.subject,
      message,
      image: payload.image,
      isAdmin: payload.isAdmin,
    };
  }

  public shouldSend(): boolean {
    if (this.getSettings().enabled) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const userRepository = getRepository(User);
    const userPushSubRepository = getRepository(UserPushSubscription);
    const settings = getSettings();

    const pushSubs: UserPushSubscription[] = [];

    const mainUser = await userRepository.findOne({ where: { id: 1 } });

    const webPushNotification = async (
      pushSub: UserPushSubscription,
      notificationPayload: Buffer
    ) => {
      logger.debug('Sending web push notification', {
        label: 'Notifications',
        recipient: pushSub.user.displayName,
        type: Notification[type],
        subject: payload.subject,
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: pushSub.endpoint,
            keys: { auth: pushSub.auth, p256dh: pushSub.p256dh },
          },
          notificationPayload
        );
      } catch (e) {
        logger.error(
          'Error sending web push notification; removing subscription',
          {
            label: 'Notifications',
            recipient: pushSub.user.displayName,
            type: Notification[type],
            subject: payload.subject,
            errorMessage: e.message,
          }
        );

        // Failed to send notification so we need to remove the subscription
        userPushSubRepository.remove(pushSub);
      }
    };

    if (
      payload.notifyUser &&
      // Check if user has webpush notifications enabled and fallback to true if undefined
      // since web push should default to true
      (payload.notifyUser.settings?.hasNotificationType(
        NotificationAgentKey.WEBPUSH,
        type
      ) ??
        true)
    ) {
      const notifySubs = await userPushSubRepository.find({
        where: { user: { id: payload.notifyUser.id } },
      });

      pushSubs.push(...notifySubs);
    }

    if (payload.notifyAdmin) {
      const users = await userRepository.find();

      const manageUsers = users.filter(
        (user) =>
          // Check if user has webpush notifications enabled and fallback to true if undefined
          // since web push should default to true
          user.settings?.hasNotificationType(
            NotificationAgentKey.WEBPUSH,
            type
          ) ?? true
      );

      const allSubs = await userPushSubRepository
        .createQueryBuilder('pushSub')
        .leftJoinAndSelect('pushSub.user', 'user')
        .where('pushSub.userId IN (:...users)', {
          users: manageUsers.map((user) => user.id),
        })
        .getMany();

      pushSubs.push(...allSubs);
    }

    if (mainUser && pushSubs.length > 0) {
      webpush.setVapidDetails(
        `mailto:${mainUser.email}`,
        settings.vapidPublic,
        settings.vapidPrivate
      );

      const notificationPayload = Buffer.from(
        JSON.stringify(this.getNotificationPayload(type, payload)),
        'utf-8'
      );

      await Promise.all(
        pushSubs.map((sub) => webPushNotification(sub, notificationPayload))
      );
    }

    return true;
  }
}

export default WebPushAgent;
