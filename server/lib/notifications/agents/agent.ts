import type { User } from '@server/entity/User';
import type { NotificationAgentConfig } from '@server/lib/settings';
import type { NotificationType } from '@server/constants/notification';
import type Invite from '@server/entity/Invite';

export interface NotificationPayload {
  event?: string;
  subject: string;
  notifySystem: boolean;
  notifyAdmin: boolean;
  notifyUser?: User;
  image?: string;
  message?: string;
  extra?: { name: string; value: string }[];
  invite?: Invite;
  isAdmin?: boolean;
  actionUrl?: string;
  actionUrlTitle?: string;
}

export abstract class BaseAgent<T extends NotificationAgentConfig> {
  protected settings?: T;
  public constructor(settings?: T) {
    this.settings = settings;
  }

  protected abstract getSettings(): T;
}

export interface NotificationAgent {
  shouldSend(): boolean;
  send(type: NotificationType, payload: NotificationPayload): Promise<boolean>;
}
