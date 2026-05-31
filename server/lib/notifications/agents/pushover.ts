import type { User } from '@server/entity/User';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentPushover,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { NotificationType } from '@server/constants/notification';
import type { NotificationPayload } from './agent';
import { PerRecipientAgent } from './perRecipientAgent';
import { truncate } from '@server/utils/textHelpers';

interface PushoverRecipient {
  accessToken: string;
  userToken: string;
  sound: string;
}

class PushoverAgent extends PerRecipientAgent<
  NotificationAgentPushover,
  PushoverRecipient
> {
  protected readonly agentKey = NotificationAgentKey.PUSHOVER;
  protected readonly agentName = 'Pushover';

  protected getSettings(): NotificationAgentPushover {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.pushover;
  }

  public shouldSend(): boolean {
    return this.getSettings().enabled;
  }

  protected hasUserCredentials(user: User): boolean {
    return (
      !!user.settings?.pushoverApplicationToken &&
      !!user.settings?.pushoverUserKey
    );
  }

  protected resolveRecipient(user?: User): PushoverRecipient | null {
    const settings = this.getSettings();
    const accessToken =
      user?.settings?.pushoverApplicationToken || settings.options.accessToken;
    const userToken =
      user?.settings?.pushoverUserKey || settings.options.userToken;
    const sound =
      user?.settings?.pushoverSound || settings.options.sound || 'pushover';

    if (!accessToken || !userToken) {
      return null;
    }

    return { accessToken, userToken, sound };
  }

  protected async deliver(
    type: NotificationType,
    payload: NotificationPayload,
    recipient: PushoverRecipient
  ): Promise<void> {
    const body = new URLSearchParams({
      token: recipient.accessToken,
      user: recipient.userToken,
      title: truncate(payload.subject, 250),
      message: truncate(payload.message ?? payload.subject, 1024),
      sound: recipient.sound,
    });

    await axios.post(
      'https://api.pushover.net/1/messages.json',
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    logger.debug('Sent Pushover notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default PushoverAgent;
