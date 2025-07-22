'use client';
import Error from '@app/app/error';
import AdminTabs from '@app/components/Common/AdminTabs';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import { CloudIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useParams, usePathname } from 'next/navigation';
import useSWR from 'swr';

const UserSettingsNotifications = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({ id: Number(userQuery.userid) });
  const { data, error } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const pathname = usePathname();

  const computedRoutes = [
    {
      text: 'Email Notifications',
      route: '/settings/notifications/email',
      content: (
        <span className="flex">
          <EnvelopeIcon className="size-5 mr-2" /> Email
        </span>
      ),
      regex: /\/settings\/notifications\/email/,
      hidden: !data?.emailEnabled,
    },
    {
      text: 'WebPush Notifications',
      route: '/settings/notifications/webpush',
      content: (
        <span className="flex">
          <CloudIcon className="size-5 mr-2" /> Web Push
        </span>
      ),
      hidden: !data?.webPushEnabled,
      regex: /\/settings\/notifications\/webpush/,
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
        <h3 className="text-2xl font-extrabold">Notification Settings</h3>
      </div>
      <AdminTabs tabType="button" AdminRoutes={computedRoutes} />
      <div className="section">{children}</div>
    </div>
  );
};
export default UserSettingsNotifications;
