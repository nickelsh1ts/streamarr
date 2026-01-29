'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import {
  EnvelopeIcon,
  CloudIcon,
  BellAlertIcon,
} from '@heroicons/react/24/solid';
import { FormattedMessage } from 'react-intl';

type NotificationsLayoutProps = {
  children: React.ReactNode;
};

const notificationTabs = [
  {
    text: 'Email',
    content: (
      <>
        <EnvelopeIcon className="size-4 inline-flex mb-0.5 mr-1" />{' '}
        <FormattedMessage id="common.email" defaultMessage="Email" />
      </>
    ),
    route: '/admin/settings/notifications/email',
    regex: /^\/admin\/settings\/notifications(\/email\/?(.*)?)?$/,
  },
  {
    text: 'Web Push',
    content: (
      <>
        <CloudIcon className="size-4 inline-flex mb-0.5 mr-1" />{' '}
        <FormattedMessage id="common.webPush" defaultMessage="Web Push" />
      </>
    ),
    route: '/admin/settings/notifications/webpush',
    regex: /^\/admin\/settings\/notifications\/webpush\/?/,
  },
  {
    text: 'In-App',
    content: (
      <>
        <BellAlertIcon className="size-4 inline-flex mb-0.5 mr-1" />{' '}
        <FormattedMessage id="common.inApp" defaultMessage="In-App" />
      </>
    ),
    route: '/admin/settings/notifications/inapp',
    regex: /^\/admin\/settings\/notifications\/inapp\/?/,
  },
];

const NotificationsLayout = ({ children }: NotificationsLayoutProps) => {
  return (
    <div className="my-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="notification.settings"
          defaultMessage="Notification Settings"
        />
      </h3>
      <p className="mb-5">
        <FormattedMessage
          id="settings.notifications.description"
          defaultMessage="Configure and enable notification agents."
        />
      </p>
      <AdminTabs tabType="button" AdminRoutes={notificationTabs} />
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default NotificationsLayout;
