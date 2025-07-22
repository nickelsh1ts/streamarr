'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import { EnvelopeIcon, CloudIcon } from '@heroicons/react/24/solid';

type NotificationsLayoutProps = {
  children: React.ReactNode;
};

const notificationTabs = [
  {
    text: 'Email',
    content: (
      <>
        <EnvelopeIcon className="size-4 inline-flex mb-0.5 mr-1" /> Email
      </>
    ),
    route: '/admin/settings/notifications/email',
    regex: /^\/admin\/settings\/notifications(\/email\/?(.*)?)?$/,
  },
  {
    text: 'Web Push',
    content: (
      <>
        <CloudIcon className="size-4 inline-flex mb-0.5 mr-1" /> Web Push
      </>
    ),
    route: '/admin/settings/notifications/webpush',
    regex: /^\/admin\/settings\/notifications\/webpush\/?/,
  },
];

const NotificationsLayout = ({ children }: NotificationsLayoutProps) => {
  return (
    <div className="my-6">
      <h3 className="text-2xl font-extrabold">Notification Settings</h3>
      <p className="mb-5">Configure and enable notification agents.</p>
      <AdminTabs tabType="button" AdminRoutes={notificationTabs} />
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default NotificationsLayout;
