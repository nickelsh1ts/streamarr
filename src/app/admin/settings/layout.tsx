'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';

type SettingsLayoutProps = {
  children: React.ReactNode;
};

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const AdminRoutes: AdminRoute[] = [
    {
      text: 'General',
      route: '/admin/settings/general',
      regex: /^\/admin(\/settings)?(\/general)?$/,
    },
    {
      text: 'Users',
      route: '/admin/settings/users',
      regex: /^\/admin\/settings\/users/,
    },
    {
      text: 'Plex',
      route: '/admin/settings/plex',
      regex: /^\/admin\/settings\/plex/,
    },
    {
      text: 'Overseerr',
      route: '/request/settings',
      regex: /^\/request\/settings/,
    },
    {
      text: 'Services',
      route: '/admin/settings/services',
      regex: /^\/admin\/settings\/services/,
    },
    {
      text: 'Notifications',
      route: '/admin/settings/notifications',
      regex: /^\/admin\/settings\/notifications/,
    },
    {
      text: 'Logs',
      route: '/admin/settings/logs',
      regex: /^\/admin\/settings\/logs/,
    },
    {
      text: 'Jobs & Cache',
      route: '/admin/settings/jobs',
      regex: /^\/admin\/settings\/jobs/,
    },
    {
      text: 'About',
      route: '/admin/settings/about',
      regex: /^\/admin\/settings\/about/,
    },
  ];

  return (
    <div className="mt-4 mx-4">
      <AdminTabs tabType="button" AdminRoutes={AdminRoutes} />
      <div className="mt-4 text-white">{children}</div>
    </div>
  );
};

export default SettingsLayout;
