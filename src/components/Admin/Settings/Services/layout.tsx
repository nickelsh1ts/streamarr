'use client';
import AdminTabs from '@app/components/Common/AdminTabs';
import { FormattedMessage } from 'react-intl';

const ServicesLayout = ({ children }: { children: React.ReactNode }) => {
  const ServicesTabs = [
    {
      text: 'Overseerr',
      route: '/admin/settings/services/overseerr',
      regex: /^\/admin\/settings\/services\/?(overseerr\/?(.*)?)?$/,
    },
    {
      text: 'Radarr',
      route: '/admin/settings/services/radarr',
      regex: /^\/admin\/settings\/services\/radarr\/?/,
    },
    {
      text: 'Sonarr',
      route: '/admin/settings/services/sonarr',
      regex: /^\/admin\/settings\/services\/sonarr\/?/,
    },
    {
      text: 'Lidarr',
      route: '/admin/settings/services/lidarr',
      regex: /^\/admin\/settings\/services\/lidarr\/?/,
    },
    {
      text: 'Prowlarr',
      route: '/admin/settings/services/prowlarr',
      regex: /^\/admin\/settings\/services\/prowlarr\/?/,
    },
    {
      text: 'Bazarr',
      route: '/admin/settings/services/bazarr',
      regex: /^\/admin\/settings\/services\/bazarr\/?/,
    },
    {
      text: 'Tdarr',
      route: '/admin/settings/services/tdarr',
      regex: /^\/admin\/settings\/services\/tdarr\/?/,
    },
    {
      text: 'Tautulli',
      route: '/admin/settings/services/tautulli',
      regex: /^\/admin\/settings\/services\/tautulli\/?/,
    },
    {
      text: 'Downloads',
      route: '/admin/settings/services/downloads',
      regex: /^\/admin\/settings\/services\/downloads\/?/,
    },
    {
      text: 'Uptime',
      route: '/admin/settings/services/uptime',
      regex: /^\/admin\/settings\/services\/uptime\/?/,
    },
  ];
  return (
    <div className="my-6">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="admin.settings.services.title"
          defaultMessage="Services"
        />
      </h3>
      <p className="mb-2">
        <FormattedMessage
          id="admin.settings.services.description"
          defaultMessage="Configure your various services below."
        />
      </p>
      <AdminTabs AdminRoutes={ServicesTabs} />
      <div className="mt-4">{children}</div>
    </div>
  );
};
export default ServicesLayout;
