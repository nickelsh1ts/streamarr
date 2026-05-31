import type { User } from '@server/entity/User';
import type { NotificationAgentConfig } from '@server/lib/settings';
import type {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import type Invite from '@server/entity/Invite';
import type Event from '@server/entity/Event';
import { getRepository } from '@server/datasource';
import { User as UserEntity } from '@server/entity/User';
import type { NotificationAgentKey } from '@server/lib/settings';
import { shouldSendAdminNotification } from '@server/lib/notifications';

/**
 * Controls which subset of agents a notification is delivered through.
 * - `All`: every active agent (default; used for single-recipient events).
 * - `Shared`: only shared-destination agents (Discord, Slack, etc.) that post
 *   once to a common channel/webhook.
 * - `Individual`: only per-recipient agents (email, web push, in-app,
 *   Telegram, Pushover, Pushbullet) that deliver to a single user.
 */
export enum NotificationDeliveryScope {
  All = 'all',
  Shared = 'shared',
  Individual = 'individual',
}

export interface NotificationPayload {
  event?: Event;
  subject: string;
  notifySystem: boolean;
  notifyAdmin: boolean;
  notifyUser?: User;
  createdBy?: User;
  updatedBy?: User;
  image?: string;
  message?: string;
  extra?: { name: string; value: string }[];
  invite?: Invite;
  isAdmin?: boolean;
  actionUrl?: string;
  actionUrlTitle?: string;
  severity?: NotificationSeverity;
}

export abstract class BaseAgent<T extends NotificationAgentConfig> {
  protected settings?: T;
  public constructor(settings?: T) {
    this.settings = settings;
  }

  protected abstract getSettings(): T;

  /**
   * The delivery scope this agent participates in. Per-recipient agents
   * (the default) deliver to individual users; shared-destination agents
   * override this to post once to a common channel.
   */
  public deliveryScope(): NotificationDeliveryScope {
    return NotificationDeliveryScope.Individual;
  }

  /**
   * Whether the notified user has the given agent enabled for this type.
   * Users without saved settings are treated as opted-in.
   */
  protected userWantsType(
    payload: NotificationPayload,
    agentKey: NotificationAgentKey,
    type: NotificationType
  ): boolean {
    return (
      !!payload.notifyUser &&
      (payload.notifyUser.settings?.hasNotificationType(agentKey, type) ?? true)
    );
  }

  /**
   * Resolves the admin users who should receive an admin-targeted
   * notification for the given agent and type. Returns an empty array when
   * the payload is not flagged for admin delivery.
   */
  protected async getEligibleAdmins(
    payload: NotificationPayload,
    agentKey: NotificationAgentKey,
    type: NotificationType
  ): Promise<User[]> {
    if (!payload.notifyAdmin) {
      return [];
    }

    const users = await getRepository(UserEntity).find({
      relations: ['settings'],
    });

    return users.filter(
      (user) =>
        (user.settings?.hasNotificationType(agentKey, type) ?? true) &&
        shouldSendAdminNotification(type, user, payload)
    );
  }
}

export interface NotificationAgent {
  deliveryScope(): NotificationDeliveryScope;
  shouldSend(): boolean;
  send(type: NotificationType, payload: NotificationPayload): Promise<boolean>;
}
