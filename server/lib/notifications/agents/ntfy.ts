import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentNtfy,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import { BroadcastAgent } from './broadcastAgent';

class NtfyAgent extends BroadcastAgent<NotificationAgentNtfy> {
  protected readonly agentKey = NotificationAgentKey.NTFY;
  protected readonly agentName = 'ntfy';

  protected getSettings(): NotificationAgentNtfy {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.ntfy;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();
    return (
      settings.enabled && !!settings.options.url && !!settings.options.topic
    );
  }

  protected async dispatch(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const settings = this.getSettings();
    const baseUrl = settings.options.url.replace(/\/$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (settings.options.authMethod === 'token' && settings.options.token) {
      headers.Authorization = `Bearer ${settings.options.token}`;
    } else if (
      settings.options.authMethod === 'usernamePassword' &&
      settings.options.username &&
      settings.options.password
    ) {
      const basic = Buffer.from(
        `${settings.options.username}:${settings.options.password}`,
        'utf-8'
      ).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }

    await axios.post(
      baseUrl,
      {
        topic: settings.options.topic,
        title: payload.subject,
        message: payload.message ?? payload.subject,
        priority: settings.options.priority ?? 3,
      },
      { headers }
    );

    logger.debug('Sent ntfy notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default NtfyAgent;
