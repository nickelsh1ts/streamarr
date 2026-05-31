import type { Server as SocketIOServer } from 'socket.io';
import type {
  NotificationAgent,
  NotificationPayload,
} from '@server/lib/notifications/agents/agent';
import { BaseAgent } from '@server/lib/notifications/agents/agent';
import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentConfig,
} from '@server/lib/settings';
import logger from '@server/logger';
import { getRepository } from '@server/datasource';
import type { User } from '@server/entity/User';
import { NotificationSeverity } from '@server/constants/notification';
import Notification from '@server/entity/Notification';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
} from '@server/lib/notifications';

interface InAppNotificationPayload extends NotificationPayload {
  notifyUser: User;
}

let io: SocketIOServer | null = null;

export function setSocketIO(socket: SocketIOServer) {
  io = socket;
}

class InAppAgent
  extends BaseAgent<NotificationAgentConfig>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentConfig {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.inApp;
  }

  private getNotificationPayload(
    type: NotificationType,
    payload: InAppNotificationPayload
  ) {
    return {
      type,
      subject: payload.subject,
      severity: payload.severity ?? NotificationSeverity.INFO,
      message: payload.message ?? '',
      createdBy: payload.createdBy,
      updatedBy: payload.updatedBy,
      notifyUser: payload.notifyUser,
      inviteId: payload.invite?.id,
      actionUrl: payload.actionUrl,
      actionUrlTitle: payload.actionUrlTitle,
    };
  }

  public shouldSend(): boolean {
    return this.getSettings().enabled;
  }

  public async send(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();
    if (!hasNotificationType(type, settings.types ?? ALL_NOTIFICATIONS)) {
      return true;
    }

    if (
      !payload.notifyUser ||
      (payload.notifyUser.settings &&
        !payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.IN_APP,
          type
        ))
    ) {
      return true;
    }

    logger.debug('Sending inApp notification', {
      label: 'Notifications',
      recipient: payload.notifyUser.displayName,
      type: NotificationType[type],
      subject: payload.subject,
    });

    const notificationPayload = this.getNotificationPayload(
      type,
      payload as InAppNotificationPayload
    );

    try {
      const notificationRepository = getRepository(Notification);
      const notification = new Notification(notificationPayload);

      await notificationRepository.save(notification);

      if (io) {
        // Emit only serializable data to avoid entity method serialization issues
        io.to(String(payload.notifyUser.id)).emit('newNotification', {
          type: notificationPayload.type,
          subject: notificationPayload.subject,
          severity: notificationPayload.severity,
          description: notificationPayload.message,
          message: notificationPayload.message,
          inviteId: notificationPayload.inviteId,
          actionUrl: notificationPayload.actionUrl,
          actionUrlTitle: notificationPayload.actionUrlTitle,
        });
      }
    } catch (e) {
      logger.error('Error sending local notification', {
        label: 'Notifications',
        type: NotificationType[type],
        errorMessage: e.message,
      });

      return false;
    }

    return true;
  }
}

export default InAppAgent;
