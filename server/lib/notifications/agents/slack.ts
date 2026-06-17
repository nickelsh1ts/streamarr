import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentSlack,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import { BroadcastAgent } from './broadcastAgent';

class SlackAgent extends BroadcastAgent<NotificationAgentSlack> {
  protected readonly agentKey = NotificationAgentKey.SLACK;
  protected readonly agentName = 'Slack';

  protected getSettings(): NotificationAgentSlack {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.slack;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();
    return settings.enabled && !!settings.options.webhookUrl;
  }

  protected async dispatch(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const settings = this.getSettings();

    await axios.post(settings.options.webhookUrl, {
      text: payload.subject,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${payload.subject}*\n${payload.message ?? ''}`,
          },
        },
      ],
    });

    logger.debug('Sent Slack notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default SlackAgent;
