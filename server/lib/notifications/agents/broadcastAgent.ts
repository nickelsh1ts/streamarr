import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
} from '@server/lib/notifications';
import type {
  NotificationAgentConfig,
  NotificationAgentKey,
} from '@server/lib/settings';
import logger from '@server/logger';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent, NotificationDeliveryScope } from './agent';

export interface BroadcastContext {
  shouldSendForUser: boolean;
  eligibleAdmins: User[];
}

/**
 * Base class for agents that post to a single shared destination (a webhook,
 * channel or topic) rather than per-recipient endpoints. Subclasses only need
 * to declare their agent key, provide `shouldSend()`, and implement
 * `dispatch()` to perform the actual delivery.
 */
export abstract class BroadcastAgent<T extends NotificationAgentConfig>
  extends BaseAgent<T>
  implements NotificationAgent
{
  protected abstract readonly agentKey: NotificationAgentKey;
  protected abstract readonly agentName: string;

  public deliveryScope(): NotificationDeliveryScope {
    return NotificationDeliveryScope.Shared;
  }

  public abstract shouldSend(): boolean;

  protected abstract dispatch(
    type: NotificationType,
    payload: NotificationPayload,
    context: BroadcastContext
  ): Promise<void>;

  public async send(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const settings = this.getSettings();
      if (!hasNotificationType(type, settings.types ?? ALL_NOTIFICATIONS)) {
        return true;
      }

      const shouldSendForUser = this.userWantsType(
        payload,
        this.agentKey,
        type
      );
      const eligibleAdmins = await this.getEligibleAdmins(
        payload,
        this.agentKey,
        type
      );

      if (shouldSendForUser || eligibleAdmins.length > 0) {
        await this.dispatch(type, payload, {
          shouldSendForUser,
          eligibleAdmins,
        });
      }

      return true;
    } catch (e) {
      logger.error(`Error sending ${this.agentName} notification`, {
        label: 'Notifications',
        type: NotificationType[type],
        subject: payload.subject,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      return false;
    }
  }
}
