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

interface InAppNotificationPayload extends NotificationPayload {
  type: NotificationType;
  severity: NotificationSeverity;
  message: string;
  createdBy: User;
  updatedBy: User;
  actionUrl?: string;
  actionUrlTitle?: string;
  inviteId?: number;
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
  ): InAppNotificationPayload {
    return {
      type: type,
      subject: payload.subject,
      severity: payload.severity ?? NotificationSeverity.INFO,
      message: payload.message ?? '',
      createdBy: payload.createdBy,
      updatedBy: payload.updatedBy,
      notifyUser: payload.notifyUser,
      inviteId: payload.invite?.id,
      actionUrl: payload.actionUrl,
      actionUrlTitle: payload.actionUrlTitle,
      notifySystem: payload.notifySystem,
      notifyAdmin: payload.notifyAdmin,
    };
  }

  public shouldSend(): boolean {
    if (this.getSettings().enabled) {
      return true;
    }

    return false;
  }

  public async send(
    type: NotificationType,
    payload: InAppNotificationPayload
  ): Promise<boolean> {
    if (payload.notifyUser) {
      if (
        !payload.notifyUser.settings ||
        // Check if user has in-app notifications enabled and fallback to true if undefined
        // since inApp should default to true
        (payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.IN_APP,
          type
        ) ??
          true)
      ) {
        logger.debug('Sending inApp notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: NotificationType[type],
          subject: payload.subject,
        });

        const notificationPayload = this.getNotificationPayload(type, payload);

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
      }

      return true;
    }
  }
}

export default InAppAgent;
