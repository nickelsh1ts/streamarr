import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import type { NotificationAgent, NotificationPayload } from './agents/agent';
import type { User } from '@server/entity/User';
import { NotificationType } from '@server/constants/notification';

export const hasNotificationType = (
  types: NotificationType | NotificationType[],
  value: number
): boolean => {
  let total = 0;

  // If we are not checking any notifications, bail out and return true
  if (types === 0) {
    return true;
  }

  if (Array.isArray(types)) {
    // Combine all notification values into one
    total = types.reduce((a, v) => a + v, 0);
  } else {
    total = types;
  }

  // Test notifications don't need to be enabled
  if (!(value & NotificationType.TEST_NOTIFICATION)) {
    value += NotificationType.TEST_NOTIFICATION;
  }

  return !!(value & total);
};

export const getAdminPermission = (type: NotificationType): Permission => {
  switch (type) {
    default:
      return Permission.ADMIN;
  }
};

export const shouldSendAdminNotification = (
  type: NotificationType,
  user: User,
  payload: NotificationPayload
): boolean => {
  return (
    user.id !== payload.notifyUser?.id &&
    user.hasPermission(getAdminPermission(type))
  );
};

class NotificationManager {
  private activeAgents: NotificationAgent[] = [];

  public registerAgents = (agents: NotificationAgent[]): void => {
    this.activeAgents = [...this.activeAgents, ...agents];
    logger.info('Registered notification agents', { label: 'Notifications' });
  };

  public sendNotification(
    type: NotificationType,
    payload: NotificationPayload
  ): void {
    logger.info(`Sending notification(s) for ${NotificationType[type]}`, {
      label: 'Notifications',
      subject: payload.subject,
    });

    this.activeAgents.forEach((agent) => {
      if (agent.shouldSend()) {
        agent.send(type, payload);
      }
    });
  }
}

const notificationManager = new NotificationManager();

export default notificationManager;
