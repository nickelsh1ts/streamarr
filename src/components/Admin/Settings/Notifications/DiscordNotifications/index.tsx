'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { isValidHttpUrl } from '@app/utils/networkValidation';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const DiscordNotifications = () => {
  const intl = useIntl();

  const DiscordSchema = Yup.object().shape({
    webhookUrl: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.discord.webhookUrlRequired',
          defaultMessage: 'You must provide your Discord webhook URL',
        })
      )
      .test(
        'valid-http-url',
        intl.formatMessage({
          id: 'notifications.discord.webhookUrlInvalid',
          defaultMessage: 'You must provide a valid Discord webhook URL',
        }),
        (value) => isValidHttpUrl(value)
      ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/discord"
      providerName={intl.formatMessage({
        id: 'notifications.providers.discord',
        defaultMessage: 'Discord',
      })}
      validationSchema={DiscordSchema}
      fields={[
        {
          name: 'webhookUrl',
          label: (
            <FormattedMessage
              id="notifications.fields.webhookUrl"
              defaultMessage="Webhook URL"
            />
          ),
          type: 'text',
          required: true,
        },
        {
          name: 'enableMentions',
          label: (
            <FormattedMessage
              id="notifications.fields.enableMentions"
              defaultMessage="Enable Mentions"
            />
          ),
          type: 'checkbox',
        },
        {
          name: 'webhookRoleId',
          label: (
            <FormattedMessage
              id="notifications.fields.notificationRoleId"
              defaultMessage="Notification Role ID"
            />
          ),
          type: 'text',
        },
        {
          name: 'botUsername',
          label: (
            <FormattedMessage
              id="notifications.fields.botUsername"
              defaultMessage="Bot Username"
            />
          ),
          type: 'text',
        },
        {
          name: 'botAvatarUrl',
          label: (
            <FormattedMessage
              id="notifications.fields.botAvatarUrl"
              defaultMessage="Bot Avatar URL"
            />
          ),
          type: 'text',
        },
      ]}
    />
  );
};

export default DiscordNotifications;
