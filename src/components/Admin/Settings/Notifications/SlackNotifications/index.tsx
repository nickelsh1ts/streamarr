'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { isValidHttpUrl } from '@app/utils/networkValidation';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const SlackNotifications = () => {
  const intl = useIntl();

  const SlackSchema = Yup.object().shape({
    webhookUrl: Yup.string().test(
      'valid-http-url',
      intl.formatMessage({
        id: 'notifications.slack.webhookUrlRequired',
        defaultMessage: 'You must provide a valid Slack webhook URL',
      }),
      (value) => isValidHttpUrl(value)
    ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/slack"
      providerName={intl.formatMessage({
        id: 'notifications.providers.slack',
        defaultMessage: 'Slack',
      })}
      validationSchema={SlackSchema}
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
      ]}
    />
  );
};

export default SlackNotifications;
