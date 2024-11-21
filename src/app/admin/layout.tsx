'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';

type AdminLayoutProps = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const AdminRoutes: AdminRoute[] = [
    {
      text: 'Settings',
      route: '/admin/settings',
      regex: /^\/admin(\/settings\/?(.*)?)?$/,
    },
    {
      text: 'Users',
      route: '/admin/users',
      regex: /^\/admin\/users/,
    },
    {
      text: 'Movies',
      route: '/admin/movies',
      regex: /^\/admin\/movies/,
    },
    {
      text: 'TV Shows',
      route: '/admin/tv',
      regex: /^\/admin\/tv/,
    },
    {
      text: 'Indexers',
      route: '/admin/indexers',
      regex: /^\/admin\/indexers/,
    },
    {
      text: 'Subtitles',
      route: '/admin/srt/series',
      regex: /^\/admin\/srt/,
    },
    {
      text: 'Transcoding',
      route: '/admin/transcode',
      regex: /^\/admin\/transcode/,
    },
    {
      text: 'Downloading',
      route: '/admin/downloads/overview',
      regex: /^\/admin\/downloads/,
    },
  ];

  return (
    <div className="px-4">
      <div className="mt-2">
        <AdminTabs AdminRoutes={AdminRoutes} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
};

export default AdminLayout;
