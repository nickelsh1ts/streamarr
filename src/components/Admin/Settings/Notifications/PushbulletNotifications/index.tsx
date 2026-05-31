'use client';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import { FormattedMessage, useIntl } from 'react-intl';
import * as Yup from 'yup';

const PushbulletNotifications = () => {
  const intl = useIntl();

  const PushbulletSchema = Yup.object().shape({
    accessToken: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushbullet.tokenRequired',
        defaultMessage: 'You must provide your Pushbullet access token',
      })
    ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/pushbullet"
      providerName={intl.formatMessage({
        id: 'notifications.providers.pushbullet',
        defaultMessage: 'Pushbullet',
      })}
      validationSchema={PushbulletSchema}
      fields={[
        {
          name: 'accessToken',
          label: (
            <FormattedMessage
              id="notifications.fields.accessToken"
              defaultMessage="Access Token"
            />
          ),
          type: 'password',
          required: true,
        },
        {
          name: 'channelTag',
          label: (
            <FormattedMessage
              id="notifications.fields.channelTag"
              defaultMessage="Channel Tag"
            />
          ),
          type: 'text',
        },
      ]}
    />
  );
};

export default PushbulletNotifications;
