'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import ServiceFrameContainer from '@app/components/Admin/ServiceFrameContainer';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { useUser } from '@app/hooks/useUser';
import { Permission } from '@server/lib/permissions';
import type {
  RadarrSettings,
  SonarrSettings,
  ServiceSettings,
} from '@server/lib/settings';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const IFRAME_ROUTE_PATTERNS = [
  /^\/admin\/movies/,
  /^\/admin\/tv/,
  /^\/admin\/music/,
  /^\/admin\/indexers/,
  /^\/admin\/srt/,
  /^\/admin\/transcode/,
  /^\/admin\/downloads/,
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const intl = useIntl();
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useUser();
  const isAdmin = hasPermission(Permission.ADMIN);
  const isManageUsers = hasPermission(Permission.MANAGE_USERS);

  useRouteGuard([Permission.ADMIN, Permission.MANAGE_USERS], { type: 'or' });

  const { data: services } = useSWR<ServiceSettings[]>(
    isAdmin ? '/api/v1/settings/services' : null
  );
  const { data: radarr } = useSWR<RadarrSettings[]>(
    isAdmin ? '/api/v1/settings/radarr' : null
  );
  const { data: sonarr } = useSWR<SonarrSettings[]>(
    isAdmin ? '/api/v1/settings/sonarr' : null
  );

  const isIframeRoute = useMemo(
    () => IFRAME_ROUTE_PATTERNS.some((p) => p.test(pathname ?? '')),
    [pathname]
  );

  const AdminRoutes: AdminRoute[] = useMemo(
    () => [
      {
        text: intl.formatMessage({
          id: 'common.settings',
          defaultMessage: 'Settings',
        }),
        route: '/admin/settings',
        regex: /^\/admin(\/settings\/?(.*)?)?$/,
      },
      {
        text: intl.formatMessage({
          id: 'common.users',
          defaultMessage: 'Users',
        }),
        route: '/admin/users',
        regex: /^\/admin\/users/,
      },
      {
        text: intl.formatMessage({
          id: 'common.movies',
          defaultMessage: 'Movies',
        }),
        route: '/admin/movies',
        regex: /^\/admin\/movies/,
        hidden: !radarr?.some((d) => d.isDefault),
      },
      {
        text: intl.formatMessage({
          id: 'common.tvShows',
          defaultMessage: 'TV Shows',
        }),
        route: '/admin/tv',
        regex: /^\/admin\/tv/,
        hidden: !sonarr?.some((d) => d.isDefault),
      },
      {
        text: intl.formatMessage({
          id: 'common.music',
          defaultMessage: 'Music',
        }),
        route: '/admin/music',
        regex: /^\/admin\/music/,
        hidden: !services?.some(
          (d) => d.id === 'lidarr' && d.enabled && d.urlBase
        ),
      },
      {
        text: intl.formatMessage({
          id: 'common.indexers',
          defaultMessage: 'Indexers',
        }),
        route: '/admin/indexers',
        regex: /^\/admin\/indexers/,
        hidden: !services?.some(
          (d) => d.id === 'prowlarr' && d.enabled && d.urlBase
        ),
      },
      {
        text: intl.formatMessage({
          id: 'common.subtitles',
          defaultMessage: 'Subtitles',
        }),
        route: '/admin/srt/series',
        regex: /^\/admin\/srt/,
        hidden: !services?.some(
          (d) => d.id === 'bazarr' && d.enabled && d.urlBase
        ),
      },
      {
        text: intl.formatMessage({
          id: 'common.transcoding',
          defaultMessage: 'Transcoding',
        }),
        route: '/admin/transcode',
        regex: /^\/admin\/transcode/,
        hidden: !services?.some(
          (d) => d.id === 'tdarr' && d.enabled && d.urlBase
        ),
      },
      {
        text: intl.formatMessage({
          id: 'common.downloading',
          defaultMessage: 'Downloading',
        }),
        route: '/admin/downloads',
        regex: /^\/admin\/downloads/,
        hidden: !services?.some(
          (d) => d.id === 'downloads' && d.enabled && d.urlBase
        ),
      },
    ],
    [intl, radarr, sonarr, services]
  );

  const visibleRoutes = useMemo(() => {
    if (isAdmin) {
      // Only filter by hidden once data is loaded, otherwise show core routes
      const dataLoaded = services && radarr && sonarr;
      if (!dataLoaded) {
        // Show Settings and Users while loading service data
        return AdminRoutes.filter(
          (r) => r.route === '/admin/settings' || r.route === '/admin/users'
        );
      }
      return AdminRoutes.filter((r) => !r.hidden);
    }
    if (isManageUsers)
      return AdminRoutes.filter((r) => r.route === '/admin/users');
    return [];
  }, [isAdmin, isManageUsers, AdminRoutes, services, radarr, sonarr]);

  if (!isAdmin && !isManageUsers) {
    return <LoadingEllipsis fixed />;
  }

  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '';
  if (isManageUsers && !isAdmin && currentPath !== '/admin/users') {
    router.replace('/admin/users');
    return <LoadingEllipsis fixed />;
  }

  const canShowContent =
    isAdmin || (isManageUsers && currentPath === '/admin/users');
  const isDataLoaded = services && radarr && sonarr;

  return (
    <div className="max-sm:mb-14">
      <div className="mt-2 px-4">
        <AdminTabs AdminRoutes={visibleRoutes} />
      </div>
      <div>
        {canShowContent &&
          (isIframeRoute ? (
            isDataLoaded ? (
              <ServiceFrameContainer
                services={services}
                radarrInstances={radarr}
                sonarrInstances={sonarr}
              />
            ) : (
              <LoadingEllipsis />
            )
          ) : (
            children
          ))}
      </div>
    </div>
  );
};

export default AdminLayout;
