import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentGotify,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import { BroadcastAgent } from './broadcastAgent';

class GotifyAgent extends BroadcastAgent<NotificationAgentGotify> {
  protected readonly agentKey = NotificationAgentKey.GOTIFY;
  protected readonly agentName = 'Gotify';

  protected getSettings(): NotificationAgentGotify {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.gotify;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();
    return (
      settings.enabled && !!settings.options.url && !!settings.options.token
    );
  }

  protected async dispatch(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const settings = this.getSettings();
    const baseUrl = settings.options.url.replace(/\/$/, '');

    await axios.post(
      `${baseUrl}/message`,
      {
        title: payload.subject,
        message: payload.message ?? payload.subject,
        priority: settings.options.priority,
      },
      {
        headers: {
          'X-Gotify-Key': settings.options.token,
        },
      }
    );

    logger.debug('Sent Gotify notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default GotifyAgent;
