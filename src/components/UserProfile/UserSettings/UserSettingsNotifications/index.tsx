'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { CloudIcon } from '@heroicons/react/24/solid';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

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
      email: `nickelsh1ts@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: `query@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
    };
  }

  const pathname = usePathname();

  const computedRoutes = useMemo(
    () =>
      [
        {
          text: 'Email Notifications',
          route: '/settings/notifications/email',
          icon: EnvelopeIcon,
          regex: /\/settings\/notifications\/email/,
        },
        {
          text: 'Cloud Notifications',
          route: '/settings/notifications/cloud',
          icon: CloudIcon,
          regex: /\/settings\/notifications\/cloud/,
        },
      ].map((settingsRoute) => ({
        ...settingsRoute,
        route: pathname.includes('/profile')
          ? `/profile${settingsRoute.route}`
          : `/admin/users/${user?.id}${settingsRoute.route}`,
      })),
    [pathname, user?.id]
  );

  return (
    <div>
      <div className="mb-6">
        <h3 className="heading">Notification Settings</h3>
      </div>
      <AdminTabs tabType="button" AdminRoutes={computedRoutes} />
      <div className="section">{children}</div>
    </div>
  );
};
export default UserSettingsNotifications;
