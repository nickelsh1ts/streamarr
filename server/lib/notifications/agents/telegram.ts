import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import {
  getSettings,
  NotificationAgentKey,
  type NotificationAgentTelegram,
} from '@server/lib/settings';
import logger from '@server/logger';
import { truncate } from '@server/utils/textHelpers';
import axios from 'axios';
import type { NotificationPayload } from './agent';
import { PerRecipientAgent } from './perRecipientAgent';

interface TelegramRecipient {
  chatId: string;
  messageThreadId?: string;
  sendSilently: boolean;
}

class TelegramAgent extends PerRecipientAgent<
  NotificationAgentTelegram,
  TelegramRecipient
> {
  protected readonly agentKey = NotificationAgentKey.TELEGRAM;
  protected readonly agentName = 'Telegram';

  protected getSettings(): NotificationAgentTelegram {
    if (this.settings) {
      return this.settings;
    }

    return getSettings().notifications.agents.telegram;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    return settings.enabled && !!settings.options.botAPI;
  }

  private resolveEndpoint(): string {
    const { botAPI } = this.getSettings().options;
    if (botAPI.startsWith('http://') || botAPI.startsWith('https://')) {
      return `${botAPI.replace(/\/$/, '')}/sendMessage`;
    }

    return `https://api.telegram.org/bot${botAPI}/sendMessage`;
  }

  protected hasUserCredentials(user: User): boolean {
    return !!user.settings?.telegramChatId;
  }

  protected resolveRecipient(user?: User): TelegramRecipient | null {
    const settings = this.getSettings();
    const chatId = user?.settings?.telegramChatId || settings.options.chatId;

    if (!chatId) {
      return null;
    }

    return {
      chatId,
      messageThreadId:
        user?.settings?.telegramMessageThreadId ||
        settings.options.messageThreadId,
      sendSilently:
        user?.settings?.telegramSendSilently ?? settings.options.sendSilently,
    };
  }

  protected async deliver(
    type: NotificationType,
    payload: NotificationPayload,
    recipient: TelegramRecipient
  ): Promise<void> {
    await axios.post(this.resolveEndpoint(), {
      chat_id: recipient.chatId,
      message_thread_id: recipient.messageThreadId || undefined,
      disable_notification: recipient.sendSilently,
      text: truncate(
        `${payload.subject}${payload.message ? `\n\n${payload.message}` : ''}`,
        4096
      ),
      disable_web_page_preview: true,
    });

    logger.debug('Sent Telegram notification', {
      label: 'Notifications',
      type: NotificationType[type],
      subject: payload.subject,
    });
  }
}

export default TelegramAgent;
