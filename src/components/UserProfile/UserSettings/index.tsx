'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import useSettings from '@app/hooks/useSettings';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

const UserSettings = ({ children }: { children: React.ReactNode }) => {
  const userQuery = useParams<{ userid: string }>();
  const pathname = usePathname();
  const { currentSettings } = useSettings();
  let user;

  if (!userQuery.userid) {
    user = {
      id: 1,
      displayName: 'Nickelsh1ts',
      avatar: '/android-chrome-192x192.png',
      email: `nickelsh1ts@${currentSettings.applicationTitle.toLowerCase()}.dev`,
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: `query@${currentSettings.applicationTitle.toLowerCase()}.dev`,
      createdAt: moment().toDate(),
    };
  }

  const computedRoutes = useMemo(
    () =>
      [
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
      ].map((settingsRoute) => ({
        ...settingsRoute,
        route: pathname.includes('/profile')
          ? `/profile${settingsRoute.route}`
          : `/admin/users/${user.id}${settingsRoute.route}`,
      })),
    [pathname, user.id]
  );

  return (
    <div className="mb-4">
      <AdminTabs AdminRoutes={computedRoutes} />
      {children}
    </div>
  );
};

export default UserSettings;
