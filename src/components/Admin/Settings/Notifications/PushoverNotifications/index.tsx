'use client';
import type { NotificationSelectOption } from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import ProviderNotificationsForm from '@app/components/Admin/Settings/Notifications/ProviderNotificationsForm';
import type { NotificationAgentPushover } from '@server/lib/settings';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const PushoverNotifications = () => {
  const intl = useIntl();
  const { data: settingsData } = useSWR<NotificationAgentPushover>(
    '/api/v1/settings/notifications/pushover'
  );
  const { data: soundsData } = useSWR<{ value: string; label: string }[]>(
    settingsData?.enabled && settingsData.options.accessToken
      ? '/api/v1/settings/notifications/pushover/sounds'
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  const hasToken = Boolean(
    settingsData?.enabled && settingsData.options.accessToken
  );
  const soundsLoaded = Boolean(soundsData?.length);
  const soundOptions: NotificationSelectOption[] = [
    {
      value: '',
      label: intl.formatMessage({
        id: 'userSettings.notifications.soundDefault',
        defaultMessage: 'Device Default',
      }),
    },
    ...(soundsData ?? []).map((s) => ({ value: s.value, label: s.label })),
  ];

  const PushoverSchema = Yup.object().shape({
    accessToken: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushover.accessTokenRequired',
        defaultMessage: 'You must provide your Pushover application API token',
      })
    ),
    userToken: Yup.string().required(
      intl.formatMessage({
        id: 'notifications.pushover.userKeyRequired',
        defaultMessage: 'You must provide your Pushover user key',
      })
    ),
  });

  return (
    <ProviderNotificationsForm
      endpoint="/api/v1/settings/notifications/pushover"
      providerName={intl.formatMessage({
        id: 'notifications.providers.pushover',
        defaultMessage: 'Pushover',
      })}
      validationSchema={PushoverSchema}
      fields={[
        {
          name: 'accessToken',
          label: (
            <FormattedMessage
              id="notifications.fields.pushoverAccessToken"
              defaultMessage="Application API Token"
            />
          ),
          type: 'password',
          required: true,
        },
        {
          name: 'userToken',
          label: (
            <FormattedMessage
              id="notifications.fields.pushoverUserKey"
              defaultMessage="User Key"
            />
          ),
          type: 'password',
          required: true,
        },
        {
          name: 'sound',
          label: (
            <FormattedMessage
              id="notifications.fields.sound"
              defaultMessage="Sound"
            />
          ),
          type: 'select',
          options: soundOptions,
          disabled: !hasToken || !soundsLoaded,
        },
      ]}
    />
  );
};

export default PushoverNotifications;
