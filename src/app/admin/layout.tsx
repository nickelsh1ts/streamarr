'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { useUser } from '@app/hooks/useUser';
import { Permission } from '@server/lib/permissions';

type AdminLayoutProps = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  useRouteGuard(Permission.ADMIN);
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
      text: 'Music',
      route: '/admin/music',
      regex: /^\/admin\/music/,
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
      route: '/admin/downloads',
      regex: /^\/admin\/downloads/,
    },
  ];

  const { hasPermission } = useUser();

  if (!hasPermission(Permission.ADMIN)) {
    return <LoadingEllipsis fixed />;
  }

  return (
    <div className="max-sm:mb-14">
      <div className="mt-2 px-4">
        <AdminTabs AdminRoutes={AdminRoutes} />
      </div>
      <div className="">{children}</div>
    </div>
  );
};

export default AdminLayout;
