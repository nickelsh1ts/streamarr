'use client';
import Error from '@app/app/error';
import AdminTabs from '@app/components/Common/AdminTabs';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import {
  BellAlertIcon,
  CloudIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useParams, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';

const UserSettingsNotifications = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const intl = useIntl();
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(userQuery.userid) });
  const { data, error } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const pathname = usePathname();

  const computedRoutes = [
    {
      text: intl.formatMessage({
        id: 'userSettings.notifications.emailTitle',
        defaultMessage: 'Email Notifications',
      }),
      route: '/settings/notifications/email',
      content: (
        <span className="flex">
          <EnvelopeIcon className="size-5 mr-2" />{' '}
          <FormattedMessage id="common.email" defaultMessage="Email" />
        </span>
      ),
      regex: /\/settings\/notifications\/email/,
      hidden: !data?.emailEnabled,
    },
    {
      text: intl.formatMessage({
        id: 'userSettings.notifications.webpushTitle',
        defaultMessage: 'Web Push Notifications',
      }),
      route: '/settings/notifications/webpush',
      content: (
        <span className="flex">
          <CloudIcon className="size-5 mr-2" />{' '}
          <FormattedMessage id="common.webPush" defaultMessage="Web Push" />
        </span>
      ),
      hidden: !data?.webPushEnabled,
      regex: /\/settings\/notifications\/webpush/,
    },
    {
      text: intl.formatMessage({
        id: 'userSettings.notifications.inAppTitle',
        defaultMessage: 'In-App Notifications',
      }),
      route: '/settings/notifications/inapp',
      content: (
        <span className="flex">
          <BellAlertIcon className="size-5 mr-2" />{' '}
          <FormattedMessage id="common.inApp" defaultMessage="In-App" />
        </span>
      ),
      hidden: !data?.inAppEnabled,
      regex: /\/settings\/notifications\/inapp/,
    },
  ].map((settingsRoute) => ({
    ...settingsRoute,
    route: pathname.includes('/profile')
      ? `/profile${settingsRoute.route}`
      : `/admin/users/${user?.id}${settingsRoute.route}`,
  }));

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return (
      <Error statusCode={500} error={{ name: 'error' }} reset={() => {}} />
    );
  }

  return (
    <div>
      <div className="mb-6 mt-3">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="settings.notifications"
            defaultMessage="Notification Settings"
          />
        </h3>
      </div>
      <AdminTabs tabType="button" AdminRoutes={computedRoutes} />
      <div className="section">{children}</div>
    </div>
  );
};
export default UserSettingsNotifications;
