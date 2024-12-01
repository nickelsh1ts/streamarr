'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { CloudIcon } from '@heroicons/react/24/solid';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';

const UserSettingsNotifications = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const userQuery = useParams<{ userid: string }>();
  let user;

  if (!userQuery.userid) {
    user = {
      id: 1,
      displayName: 'Nickelsh1ts',
      avatar: '/android-chrome-192x192.png',
      email: 'nickelsh1ts@streamarr.dev',
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: 'query@streamarr.dev',
      createdAt: moment().toDate(),
    };
  }

  const pathname = usePathname();
  const settingsRoutes: AdminRoute[] = [
    {
      text: 'Email',
      content: (
        <span className="flex items-center">
          <EnvelopeIcon className="mr-2 h-4" />
          Email
        </span>
      ),
      route: '/settings/notifications/email',
      regex: /\/settings\/notifications(\/email)?$/,
    },
    {
      text: 'Webpush',
      content: (
        <span className="flex items-center">
          <CloudIcon className="mr-2 h-4" />
          Webpush
        </span>
      ),
      route: '/settings/notifications/webpush',
      regex: /\/settings\/notifications\/webpush/,
    },
  ];

  settingsRoutes.forEach((settingsRoute) => {
    settingsRoute.route = pathname.includes('/profile')
      ? `/profile${settingsRoute.route}`
      : `/admin/users/${user?.id}${settingsRoute.route}`;
  });

  return (
    <div>
      <div className="mb-6">
        <h3 className="heading">Notification Settings</h3>
      </div>
      <AdminTabs tabType="button" AdminRoutes={settingsRoutes} />
      <div className="section">{children}</div>
    </div>
  );
};
export default UserSettingsNotifications;
