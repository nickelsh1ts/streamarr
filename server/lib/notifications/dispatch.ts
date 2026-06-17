import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import type { IntlShape } from '@server/i18n';
import { getIntl } from '@server/i18n';
import logger from '@server/logger';
import notificationManager from '.';
import type { NotificationPayload } from './agents/agent';
import { NotificationDeliveryScope } from './agents/agent';

type GroupNotificationContent = Omit<
  NotificationPayload,
  'notifySystem' | 'notifyAdmin' | 'notifyUser'
>;

/**
 * Sends an admin/group notification consistently across all trigger points:
 * - one shared-destination broadcast (Discord, Slack, Gotify, ntfy, webhook)
 *   posted once to the common channel using the default locale;
 * - one localized per-recipient delivery (email, web push, in-app, Telegram,
 *   Pushover, Pushbullet) for each recipient.
 *
 * `buildContent` is invoked with the appropriate locale for each delivery so
 * subjects/messages are translated per recipient. The shared broadcast fires
 * even when `recipients` is empty, so a configured channel still receives the
 * announcement when no individual recipients opted in.
 */
export const sendGroupNotification = async (
  type: NotificationType,
  recipients: User[],
  buildContent: (intl: IntlShape) => GroupNotificationContent
): Promise<void> => {
  logger.info(`Sending notification(s) for ${NotificationType[type]}`, {
    label: 'Notifications',
    recipients: recipients.length,
  });

  try {
    await notificationManager.sendNotification(
      type,
      {
        ...buildContent(getIntl()),
        notifySystem: false,
        notifyAdmin: true,
      },
      NotificationDeliveryScope.Shared
    );
  } catch (e) {
    logger.error('Failed to send broadcast notification', {
      label: 'Notifications',
      type: NotificationType[type],
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }

  await Promise.all(
    recipients.map(async (user) => {
      try {
        await notificationManager.sendNotification(
          type,
          {
            ...buildContent(getIntl(user.settings?.locale)),
            notifySystem: false,
            notifyAdmin: false,
            notifyUser: user,
          },
          NotificationDeliveryScope.Individual
        );
      } catch (e) {
        logger.error('Failed to send notification', {
          label: 'Notifications',
          type: NotificationType[type],
          userId: user.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    })
  );
};
