import { NotificationType } from '@server/constants/notification';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentDiscord,
} from '@server/lib/settings';
import logger from '@server/logger';
import { truncate } from '@server/utils/textHelpers';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import type { BroadcastContext } from './broadcastAgent';
import { BroadcastAgent } from './broadcastAgent';

class DiscordAgent extends BroadcastAgent<NotificationAgentDiscord> {
  protected readonly agentKey = NotificationAgentKey.DISCORD;
  protected readonly agentName = 'Discord';

  protected getSettings(): NotificationAgentDiscord {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.discord;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();
    return settings.enabled && !!settings.options.webhookUrl;
  }

  private buildContent(
    payload: NotificationPayload,
    mentionPrefix?: string
  ): string {
    if (!mentionPrefix) {
      return payload.subject;
    }

    return `${mentionPrefix} ${payload.subject}`;
  }

  private resolveMentionPrefix(
    payload: NotificationPayload,
    context: BroadcastContext
  ): string | undefined {
    const settings = this.getSettings();

    if (!settings.options.enableMentions) {
      return undefined;
    }

    // Prefer a user @mention; fall back to role mention for admin-only sends.
    // Only render the mention when the stored ID is a valid Discord snowflake
    // to prevent injecting arbitrary mentions (e.g. @everyone) into the channel.
    const discordId = payload.notifyUser?.settings?.discordId;
    if (
      context.shouldSendForUser &&
      discordId &&
      /^\d{17,20}$/.test(discordId)
    ) {
      return `<@${discordId}>`;
    }

    if (settings.options.webhookRoleId) {
      return `<@&${settings.options.webhookRoleId}>`;
    }

    return undefined;
  }

  protected async dispatch(
    type: NotificationType,
    payload: NotificationPayload,
    context: BroadcastContext
  ): Promise<void> {
    const settings = this.getSettings();
    const mentionPrefix = this.resolveMentionPrefix(payload, context);

    await axios.post(settings.options.webhookUrl, {
      username: settings.options.botUsername || 'Streamarr',
      avatar_url: settings.options.botAvatarUrl,
      content: this.buildContent(payload, mentionPrefix),
      embeds: [
        {
          title: truncate(payload.subject, 256),
          description: truncate(payload.message ?? '', 4096),
          color: 5814783,
          fields: payload.actionUrl
            ? [
                {
                  name: payload.actionUrlTitle || 'Action',
                  value: payload.actionUrl,
                },
              ]
            : [],
        },
      ],
      allowed_mentions: settings.options.enableMentions
        ? undefined
        : { parse: [] },
    });

    logger.debug('Sent Discord notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default DiscordAgent;
