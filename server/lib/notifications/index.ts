import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import { NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type { NotificationAgent, NotificationPayload } from './agents/agent';
import { NotificationDeliveryScope } from './agents/agent';

export const ALL_NOTIFICATIONS = Object.values(NotificationType)
  .filter((v) => !isNaN(Number(v)))
  .reduce((a, v) => a | Number(v), 0);

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
    total = types.reduce((a, v) => a | v, 0);
  } else {
    total = types;
  }

  // Test notifications don't need to be enabled
  if (!(value & NotificationType.TEST_NOTIFICATION)) {
    value |= NotificationType.TEST_NOTIFICATION;
  }

  return !!(value & total);
};

export const getAdminPermission = (type: NotificationType): Permission[] => {
  switch (type) {
    case NotificationType.NEW_INVITE:
    case NotificationType.INVITE_REDEEMED:
    case NotificationType.INVITE_EXPIRED:
      return [Permission.MANAGE_INVITES, Permission.ADMIN];
    case NotificationType.USER_CREATED:
    case NotificationType.ACCESS_EXTENSION_REQUESTED:
    case NotificationType.PLEX_ACCESS_LOST:
      return [Permission.MANAGE_USERS, Permission.ADMIN];
    case NotificationType.LOCAL_MESSAGE:
      return [Permission.MANAGE_NOTIFICATIONS, Permission.ADMIN];
    case NotificationType.NEW_EVENT:
      return [Permission.VIEW_SCHEDULE, Permission.ADMIN];
    default:
      return [Permission.ADMIN];
  }
};

export const shouldSendAdminNotification = (
  type: NotificationType,
  user: User,
  payload: NotificationPayload
): boolean => {
  return (
    user.id !== payload.notifyUser?.id &&
    user.hasPermission(getAdminPermission(type), { type: 'or' })
  );
};

/**
 * Agent keys that deliver to an individual recipient (as opposed to
 * shared-destination agents that post once to a common channel). Used to
 * decide whether a specific user can actually receive an individual delivery.
 */
export const PER_RECIPIENT_AGENT_KEYS: NotificationAgentKey[] = [
  NotificationAgentKey.EMAIL,
  NotificationAgentKey.WEBPUSH,
  NotificationAgentKey.IN_APP,
  NotificationAgentKey.TELEGRAM,
  NotificationAgentKey.PUSHOVER,
  NotificationAgentKey.PUSHBULLET,
];

/**
 * Returns true if the user has at least one notification agent enabled for
 * the given type. Users without saved settings are treated as fully opted-in.
 *
 * By default only per-recipient agents are considered, because shared-channel
 * agents (Discord, Slack, Gotify, ntfy, webhook) cannot deliver to a single
 * user — they post once to a common destination regardless of the recipient
 * list. Pass `NotificationDeliveryScope.All` to consider every agent key.
 */
export const userAcceptsNotificationType = (
  user: User,
  type: NotificationType,
  scope: NotificationDeliveryScope = NotificationDeliveryScope.Individual
): boolean => {
  if (!user.settings) {
    return true;
  }

  const agentKeys =
    scope === NotificationDeliveryScope.Individual
      ? PER_RECIPIENT_AGENT_KEYS
      : Object.values(NotificationAgentKey);

  return agentKeys.some((agentKey) =>
    user.settings.hasNotificationType(agentKey, type)
  );
};

class NotificationManager {
  private activeAgents: NotificationAgent[] = [];

  public registerAgents = (agents: NotificationAgent[]): void => {
    this.activeAgents = [...this.activeAgents, ...agents];
    logger.info('Registered notification agents', { label: 'Notifications' });
  };

  public async sendNotification(
    type: NotificationType,
    payload: NotificationPayload,
    scope: NotificationDeliveryScope = NotificationDeliveryScope.All
  ): Promise<boolean> {
    logger.info(`Sending notification(s) for ${NotificationType[type]}`, {
      label: 'Notifications',
      subject: payload.subject,
    });

    const activeAgents = this.activeAgents.filter(
      (agent) =>
        agent.shouldSend() &&
        (scope === NotificationDeliveryScope.All ||
          agent.deliveryScope() === scope)
    );

    if (activeAgents.length === 0) {
      if (scope === NotificationDeliveryScope.All) {
        logger.warn('No active notification agents available for delivery', {
          label: 'Notifications',
          type: NotificationType[type],
          subject: payload.subject,
        });
        return false;
      }
      return true;
    }

    const results = await Promise.all(
      activeAgents.map(async (agent) => {
        try {
          return await agent.send(type, payload);
        } catch (e) {
          logger.error('Notification agent threw while sending notification', {
            label: 'Notifications',
            agent: agent.constructor.name,
            type: NotificationType[type],
            subject: payload.subject,
            errorMessage: e instanceof Error ? e.message : String(e),
          });

          return false;
        }
      })
    );

    return results.every(Boolean);
  }
}

const notificationManager = new NotificationManager();

export default notificationManager;
