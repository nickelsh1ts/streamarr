'use client';
import AdminTabs from '@app/components/Common/AdminTabs';

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

const ServicesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mt-6 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
      <h3 className="text-2xl font-extrabold">Services</h3>
      <p className="mb-2">Configure your various services below.</p>
      <AdminTabs AdminRoutes={ServicesTabs} />
      <div className="mt-4">{children}</div>
    </div>
  );
};
export default ServicesLayout;
