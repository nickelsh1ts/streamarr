'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';

const UserSettings = ({ children }: { children: React.ReactNode }) => {
  const AdminRoutes: AdminRoute[] = [
    {
      text: 'General',
      route: '/settings/general',
      regex: /\/settings(\/general)?$/,
    },
    {
      text: 'Password',
      route: '/settings/password',
      regex: /\/settings\/password/,
    },
    {
      text: 'Notifications',
      route: '/settings/notifications/email',
      regex: /\/settings\/notifications/,
    },
    {
      text: 'Permissions',
      route: '/settings/permissions',
      regex: /\/settings\/permissions/,
    },
  ];

  const userQuery = useParams<{ userid: string }>();
  const pathname = usePathname();
  let user;

  if (!userQuery.userid) {
    user = {
      id: 1,
      displayName: 'Nickelsh1ts',
      avatar: '/android-chrome-192x192.png',
      email: `nickelsh1ts@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase()}.dev`,
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: `query@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase()}.dev`,
      createdAt: moment().toDate(),
    };
  }

  AdminRoutes.forEach((settingsRoute) => {
    settingsRoute.route = pathname.includes('/profile')
      ? `/profile${settingsRoute.route}`
      : `/admin/users/${user.id}${settingsRoute.route}`;
  });

  return (
    <div className="mb-4">
      <AdminTabs AdminRoutes={AdminRoutes} />
      {children}
    </div>
  );
};

export default UserSettings;
