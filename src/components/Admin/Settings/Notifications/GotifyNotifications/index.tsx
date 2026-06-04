'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { isValidHttpUrl } from '@app/utils/networkValidation';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const GotifyNotifications = () => {
  const intl = useIntl();

  const GotifySchema = Yup.object().shape({
    url: Yup.string()
      .required(
        intl.formatMessage({
          id: 'notifications.gotify.urlRequired',
          defaultMessage: 'You must provide your Gotify server URL',
        })
      )
      .test(
        'valid-http-url',
        intl.formatMessage({
          id: 'notifications.gotify.urlInvalid',
          defaultMessage: 'You must provide a valid Gotify server URL',
        }),
        (value) => isValidHttpUrl(value)
      ),
    token: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.gotify.tokenRequired',
        defaultMessage: 'You must provide a Gotify application token',
      })
    ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/gotify"
      providerName={intl.formatMessage({
        id: 'notifications.providers.gotify',
        defaultMessage: 'Gotify',
      })}
      validationSchema={GotifySchema}
      fields={[
        {
          name: 'url',
          label: (
            <FormattedMessage
              id="notifications.fields.serverUrl"
              defaultMessage="Server URL"
            />
          ),
          type: 'text',
          required: true,
        },
        {
          name: 'token',
          label: (
            <FormattedMessage
              id="notifications.fields.applicationToken"
              defaultMessage="Application Token"
            />
          ),
          type: 'password',
          required: true,
        },
        {
          name: 'priority',
          label: (
            <FormattedMessage
              id="notifications.fields.priority"
              defaultMessage="Priority"
            />
          ),
          type: 'number',
        },
      ]}
    />
  );
};

export default GotifyNotifications;
