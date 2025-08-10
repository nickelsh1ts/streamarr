'use client';
import Error from '@app/app/error';
import AdminTabs from '@app/components/Common/AdminTabs';
import Alert from '@app/components/Common/Alert';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { hasPermission } from '@server/lib/permissions';
import { useParams, usePathname } from 'next/navigation';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const UserSettings = ({ children }: { children: React.ReactNode }) => {
  const intl = useIntl();
  const settings = useSettings();
  const { user: currentUser } = useUser();
  const params = useParams<{ userid: string }>();
  const { user, error } = useUser({ id: Number(params.userid) });
  const pathname = usePathname();
  const { data } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  if (!user && !error) {
    return <LoadingEllipsis />;
  }

  if (!user) {
    return (
      <Error reset={() => {}} error={{ name: 'Error' }} statusCode={500} />
    );
  }

  const computedRoutes = [
    {
      text: intl.formatMessage({
        id: 'sidebar.general',
        defaultMessage: 'General',
      }),
      route: '/settings/general',
      regex: /\/settings(\/general)?$/,
    },
    {
      text: intl.formatMessage({
        id: 'common.password',
        defaultMessage: 'Password',
      }),
      route: '/settings/password',
      regex: /\/settings\/password/,
      hidden:
        (!settings.currentSettings.localLogin &&
          !hasPermission(Permission.ADMIN, currentUser?.permissions ?? 0)) ||
        (currentUser?.id !== 1 &&
          currentUser?.id !== user?.id &&
          hasPermission(Permission.ADMIN, user?.permissions ?? 0)),
    },
    {
      text: intl.formatMessage({
        id: 'common.notifications',
        defaultMessage: 'Notifications',
      }),
      route: data?.emailEnabled
        ? '/settings/notifications/email'
        : '/settings/notifications/webpush',
      regex: /\/settings\/notifications/,
    },
    {
      text: intl.formatMessage({
        id: 'settings.permissions',
        defaultMessage: 'Permissions',
      }),
      route: '/settings/permissions',
      regex: /\/settings\/permissions/,
      requiredPermission: Permission.MANAGE_USERS,
      hidden: currentUser?.id !== 1 && currentUser?.id === user.id,
    },
  ].map((settingsRoute) => ({
    ...settingsRoute,
    route: pathname.includes('/profile')
      ? `/profile${settingsRoute.route}`
      : `/admin/users/${user.id}${settingsRoute.route}`,
  }));

  if (currentUser?.id !== 1 && user.id === 1) {
    return (
      <>
        <div className="mt-6">
          <Alert
            title={intl.formatMessage({
              id: 'settings.permissions.error',
              defaultMessage:
                "You do not have permission to modify this user's settings.",
            })}
            type="error"
          />
        </div>
      </>
    );
  }

  return (
    <div className="mb-4">
      <AdminTabs AdminRoutes={computedRoutes} />
      {children}
    </div>
  );
};

export default UserSettings;
