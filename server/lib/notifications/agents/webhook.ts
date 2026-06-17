import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentWebhook,
} from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { get } from 'lodash';
import type { NotificationPayload } from './agent';
import { BroadcastAgent } from './broadcastAgent';

type KeyMapFunction = (
  payload: NotificationPayload,
  type: NotificationType
) => string;

const KeyMap: Record<string, string | KeyMapFunction> = {
  notification_type: (_payload, type) => NotificationType[type],
  subject: 'subject',
  message: 'message',
  image: 'image',
  notifyuser_username: 'notifyUser.displayName',
  notifyuser_email: 'notifyUser.email',
  notifyuser_avatar: 'notifyUser.avatar',
};

class WebhookAgent extends BroadcastAgent<NotificationAgentWebhook> {
  protected readonly agentKey = NotificationAgentKey.WEBHOOK;
  protected readonly agentName = 'webhook';

  protected getSettings(): NotificationAgentWebhook {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.webhook;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();
    return settings.enabled && !!settings.options.webhookUrl;
  }

  private parseKeys(
    finalPayload: Record<string, unknown>,
    payload: NotificationPayload,
    type: NotificationType
  ): Record<string, unknown> {
    Object.keys(finalPayload).forEach((key) => {
      if (key === '{{extra}}') {
        finalPayload.extra = payload.extra ?? [];
        delete finalPayload[key];
        key = 'extra';
      }

      const value = finalPayload[key];

      if (typeof value === 'string') {
        finalPayload[key] = Object.keys(KeyMap).reduce((result, keymapKey) => {
          const keymapValue = KeyMap[keymapKey as keyof typeof KeyMap];
          return result.replace(
            new RegExp(`{{${keymapKey}}}`, 'g'),
            typeof keymapValue === 'function'
              ? keymapValue(payload, type)
              : (get(payload, keymapValue) ?? '')
          );
        }, value);
      } else if (value && typeof value === 'object') {
        finalPayload[key] = this.parseKeys(
          value as Record<string, unknown>,
          payload,
          type
        );
      }
    });

    return finalPayload;
  }

  private buildPayload(type: NotificationType, payload: NotificationPayload) {
    const settings = this.getSettings();

    if (settings.options.jsonPayload) {
      try {
        const parsed = JSON.parse(settings.options.jsonPayload) as Record<
          string,
          unknown
        >;
        return this.parseKeys(parsed, payload, type);
      } catch {
        logger.warn(
          'Webhook: invalid JSON template, falling back to default payload',
          { label: 'Notifications' }
        );
      }
    }

    return {
      notification_type: NotificationType[type],
      subject: payload.subject,
      message: payload.message,
      image: payload.image,
      actionUrl: payload.actionUrl,
      actionUrlTitle: payload.actionUrlTitle,
      extra: payload.extra ?? [],
      isAdmin: payload.isAdmin,
    };
  }

  protected async dispatch(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<void> {
    const settings = this.getSettings();
    const hasExplicitAuthHeader = !!settings.options.authHeader;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (settings.options.authHeader) {
      headers.Authorization = settings.options.authHeader;
    }

    if (settings.options.customHeaders?.length) {
      settings.options.customHeaders.forEach((header) => {
        if (header.key) {
          if (
            hasExplicitAuthHeader &&
            header.key.toLowerCase() === 'authorization'
          ) {
            return;
          }

          headers[header.key] = header.value;
        }
      });
    }

    await axios.post(
      settings.options.webhookUrl,
      this.buildPayload(type, payload),
      {
        headers,
      }
    );

    logger.debug('Sent webhook notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default WebhookAgent;
