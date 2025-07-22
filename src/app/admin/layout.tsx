'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { useUser } from '@app/hooks/useUser';
import { Permission } from '@server/lib/permissions';
import type { RadarrSettings, SonarrSettings } from '@server/lib/settings';
import { type ServiceSettings } from '@server/lib/settings';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

type AdminLayoutProps = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter();
  const { hasPermission } = useUser();
  const isAdmin = hasPermission(Permission.ADMIN);
  const isManageUsers = hasPermission(Permission.MANAGE_USERS);

  const { data } = useSWR<ServiceSettings[]>(
    isAdmin ? '/api/v1/settings/services' : null
  );
  const { data: radarrData } = useSWR<RadarrSettings[]>(
    isAdmin ? '/api/v1/settings/radarr' : null
  );
  const { data: sonarrData } = useSWR<SonarrSettings[]>(
    isAdmin ? '/api/v1/settings/sonarr' : null
  );
  useRouteGuard([Permission.ADMIN, Permission.MANAGE_USERS], { type: 'or' });

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
      hidden: !radarrData?.some((d) => d.isDefault),
    },
    {
      text: 'TV Shows',
      route: '/admin/tv',
      regex: /^\/admin\/tv/,
      hidden: !sonarrData?.some((d) => d.isDefault),
    },
    {
      text: 'Music',
      route: '/admin/music',
      regex: /^\/admin\/music/,
      hidden: data?.some(
        (d) => d.id.includes('lidarr') && (!d.enabled || !d.urlBase)
      ),
    },
    {
      text: 'Indexers',
      route: '/admin/indexers',
      regex: /^\/admin\/indexers/,
      hidden: data?.some(
        (d) => d.id.includes('prowlarr') && (!d.enabled || !d.urlBase)
      ),
    },
    {
      text: 'Subtitles',
      route: '/admin/srt/series',
      regex: /^\/admin\/srt/,
      hidden: data?.some(
        (d) => d.id.includes('bazarr') && (!d.enabled || !d.urlBase)
      ),
    },
    {
      text: 'Transcoding',
      route: '/admin/transcode',
      regex: /^\/admin\/transcode/,
      hidden: data?.some(
        (d) => d.id.includes('tdarr') && (!d.enabled || !d.urlBase)
      ),
    },
    {
      text: 'Downloading',
      route: '/admin/downloads',
      regex: /^\/admin\/downloads/,
      hidden: data?.some(
        (d) => d.id.includes('downloads') && (!d.enabled || !d.urlBase)
      ),
    },
  ];

  let visibleRoutes: AdminRoute[] = [];
  if (isAdmin) {
    visibleRoutes = AdminRoutes.filter((route) => !route.hidden);
  } else if (isManageUsers) {
    visibleRoutes = AdminRoutes.filter(
      (route) => route.route === '/admin/users'
    );
  }

  if (!isAdmin && !isManageUsers) {
    return <LoadingEllipsis fixed />;
  }

  // Only allow access to /admin/users for MANAGE_USERS (not ADMIN)
  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '';
  if (isManageUsers && !isAdmin && currentPath !== '/admin/users') {
    router.replace('/admin/users');
    return <LoadingEllipsis fixed />;
  }

  // Only show children if ADMIN or MANAGE_USERS on /admin/users
  const canShowChildren =
    isAdmin || (isManageUsers && currentPath === '/admin/users');

  return (
    <div className="max-sm:mb-14">
      <div className="mt-2 px-4">
        <AdminTabs AdminRoutes={visibleRoutes} />
      </div>
      <div className="">{canShowChildren ? children : null}</div>
    </div>
  );
};

export default AdminLayout;
