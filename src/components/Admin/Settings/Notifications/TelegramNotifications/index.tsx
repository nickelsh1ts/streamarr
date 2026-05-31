'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const TelegramNotifications = () => {
  const intl = useIntl();

  const TelegramSchema = Yup.object().shape({
    botAPI: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.telegram.botApiRequired',
        defaultMessage: 'You must provide your Telegram bot API token or URL',
      })
    ),
    chatId: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.telegram.chatIdRequired',
        defaultMessage: 'You must provide your Telegram chat ID',
      })
    ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/telegram"
      providerName={intl.formatMessage({
        id: 'notifications.providers.telegram',
        defaultMessage: 'Telegram',
      })}
      validationSchema={TelegramSchema}
      fields={[
        {
          name: 'botAPI',
          label: (
            <FormattedMessage
              id="notifications.fields.telegramBotApi"
              defaultMessage="Bot API Token or URL"
            />
          ),
          type: 'password',
          required: true,
        },
        {
          name: 'chatId',
          label: (
            <FormattedMessage
              id="notifications.fields.telegramChatId"
              defaultMessage="Chat ID"
            />
          ),
          type: 'text',
          required: true,
        },
        {
          name: 'botUsername',
          label: (
            <FormattedMessage
              id="notifications.fields.telegramBotUsername"
              defaultMessage="Bot Username"
            />
          ),
          type: 'text',
        },
        {
          name: 'sendSilently',
          label: (
            <FormattedMessage
              id="notifications.fields.telegramSendSilently"
              defaultMessage="Send Silently"
            />
          ),
          type: 'checkbox',
        },
        {
          name: 'messageThreadId',
          label: (
            <FormattedMessage
              id="notifications.fields.telegramMessageThreadId"
              defaultMessage="Message Thread ID"
            />
          ),
          type: 'text',
        },
      ]}
    />
  );
};

export default TelegramNotifications;
