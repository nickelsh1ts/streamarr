'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@server/lib/permissions';
import type { ServiceSettings } from '@server/lib/settings';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

//TODO: Add new newsletter management settings and feature

type SettingsLayoutProps = { children: React.ReactNode };

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const intl = useIntl();
  const { data } = useSWR<ServiceSettings[]>('/api/v1/settings/services');
  useRouteGuard(Permission.ADMIN);

  const AdminRoutes: AdminRoute[] = [
    {
      text: intl.formatMessage({
        id: 'common.general',
        defaultMessage: 'General',
      }),
      route: '/admin/settings/general',
      regex: /^\/admin(\/settings)?(\/general)?$/,
      dataTutorial: 'general-settings-tab',
    },
    {
      text: intl.formatMessage({ id: 'common.users', defaultMessage: 'Users' }),
      route: '/admin/settings/users',
      regex: /^\/admin\/settings\/users/,
    },
    {
      text: intl.formatMessage({
        id: 'common.onboarding',
        defaultMessage: 'Onboarding',
      }),
      route: '/admin/settings/onboarding',
      regex: /^\/admin\/settings\/onboarding/,
      dataTutorial: 'admin-settings-onboarding',
    },
    {
      text: intl.formatMessage({ id: 'common.plex', defaultMessage: 'Plex' }),
      route: '/admin/settings/plex',
      regex: /^\/admin\/settings\/plex/,
    },
    {
      text: 'Overseerr',
      route: '/admin/settings/overseerr/settings',
      regex: /^\/admin\/settings\/overseerr\/?(.*)?/,
      hidden: data?.some(
        (d) => d.id.includes('overseerr') && (!d.enabled || !d.urlBase)
      ),
    },
    {
      text: intl.formatMessage({
        id: 'common.services',
        defaultMessage: 'Services',
      }),
      route: '/admin/settings/services',
      regex: /^\/admin\/settings\/services/,
      dataTutorial: 'services-settings-tab',
    },
    {
      text: intl.formatMessage({
        id: 'common.notifications',
        defaultMessage: 'Notifications',
      }),
      route: '/admin/settings/notifications',
      regex: /^\/admin\/settings\/notifications/,
    },
    {
      text: intl.formatMessage({ id: 'common.logs', defaultMessage: 'Logs' }),
      route: '/admin/settings/logs',
      regex: /^\/admin\/settings\/logs/,
    },
    {
      text: intl.formatMessage({
        id: 'common.jobsAndCache',
        defaultMessage: 'Jobs & Cache',
      }),
      route: '/admin/settings/jobs',
      regex: /^\/admin\/settings\/jobs/,
    },
    {
      text: intl.formatMessage({
        id: 'common.system',
        defaultMessage: 'System',
      }),
      route: '/admin/settings/system',
      regex: /^\/admin\/settings\/system/,
    },
  ];

  return (
    <div className="mt-4 mx-4">
      <AdminTabs
        tabType="button"
        AdminRoutes={AdminRoutes}
        dataTutorial="admin-settings-tabs"
      />
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default SettingsLayout;
