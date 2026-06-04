import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
} from '@server/lib/notifications';
import type { NotificationAgentConfig } from '@server/lib/settings';
import type { NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

/**
 * Base class for agents that deliver to per-recipient endpoints (a user's own
 * chat, token or credentials). Personal notifications are only delivered when
 * the recipient has configured their own credentials — they never fall back to
 * the global/admin destination. The globally-configured recipient is used only
 * for system/admin deliveries (e.g. test notifications). Subclasses provide the
 * recipient resolution, a credential check, and the actual delivery.
 *
 * @typeParam T - The agent's settings shape.
 * @typeParam R - The resolved recipient/delivery options for a single send.
 */
export abstract class PerRecipientAgent<T extends NotificationAgentConfig, R>
  extends BaseAgent<T>
  implements NotificationAgent
{
  protected abstract readonly agentKey: NotificationAgentKey;
  protected abstract readonly agentName: string;

  public abstract shouldSend(): boolean;

  /**
   * Resolve delivery options for a specific user, or the global configuration
   * when no user is given. Returns null when no recipient can be resolved.
   */
  protected abstract resolveRecipient(user?: User): R | null;

  /**
   * Whether the user has their own credentials, as opposed to relying on the
   * global configuration.
   */
  protected abstract hasUserCredentials(user: User): boolean;

  protected abstract deliver(
    type: NotificationType,
    payload: NotificationPayload,
    recipient: R
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

      // System/admin destination (e.g. test notifications) delivers to the
      // globally-configured recipient.
      if (payload.notifySystem) {
        const globalRecipient = this.resolveRecipient();
        if (globalRecipient) {
          await this.deliver(type, payload, globalRecipient);
        }
      }

      // Personal destination delivers only when the user has configured their
      // own credentials — never fall back to the global/admin destination.
      if (
        payload.notifyUser &&
        this.hasUserCredentials(payload.notifyUser) &&
        this.userWantsType(payload, this.agentKey, type)
      ) {
        const userRecipient = this.resolveRecipient(payload.notifyUser);
        if (userRecipient) {
          await this.deliver(type, payload, userRecipient);
        }
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
