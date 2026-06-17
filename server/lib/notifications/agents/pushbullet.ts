import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentPushbullet,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import { PerRecipientAgent } from './perRecipientAgent';

class PushbulletAgent extends PerRecipientAgent<
  NotificationAgentPushbullet,
  string
> {
  protected readonly agentKey = NotificationAgentKey.PUSHBULLET;
  protected readonly agentName = 'Pushbullet';

  protected getSettings(): NotificationAgentPushbullet {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.pushbullet;
  }

  public shouldSend(): boolean {
    return this.getSettings().enabled;
  }

  protected hasUserCredentials(user: User): boolean {
    return !!user.settings?.pushbulletAccessToken;
  }

  protected resolveRecipient(user?: User): string | null {
    return (
      user?.settings?.pushbulletAccessToken ||
      this.getSettings().options.accessToken ||
      null
    );
  }

  protected async deliver(
    type: NotificationType,
    payload: NotificationPayload,
    accessToken: string
  ): Promise<void> {
    const settings = this.getSettings();

    await axios.post(
      'https://api.pushbullet.com/v2/pushes',
      {
        type: 'note',
        title: payload.subject,
        body: payload.message ?? '',
        channel_tag: settings.options.channelTag || undefined,
      },
      {
        headers: {
          'Access-Token': accessToken,
        },
      }
    );

    logger.debug('Sent Pushbullet notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default PushbulletAgent;
