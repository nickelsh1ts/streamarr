'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ServiceNotConfigured } from '@app/components/Common/ServiceError';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import { useServiceFrame } from '@app/hooks/useServiceFrame';
import { useUser, Permission } from '@app/hooks/useUser';
import type {
  RadarrSettings,
  ServiceSettings,
  SonarrSettings,
} from '@server/lib/settings';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  services: ServiceSettings[];
  radarrInstances: RadarrSettings[];
  sonarrInstances: SonarrSettings[];
}

/**
 * Renders the appropriate service iframe based on the current route.
 */
const ServiceFrameContainer = ({
  services,
  radarrInstances,
  sonarrInstances,
}: Props) => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  );
  const pathname = usePathname();
  const { hasPermission } = useUser();
  const isAdmin = hasPermission(Permission.ADMIN);

  const { activeFrame, isMoviesRoute, isTvRoute } = useServiceFrame(
    services,
    radarrInstances,
    sonarrInstances
  );

  const radarrTabs: AdminRoute[] = useMemo(() => {
    if (radarrInstances.length <= 1) return [];
    return radarrInstances.map((d) => ({
      route: `/admin/movies${d.id > 0 ? `/${d.id}` : ''}`,
      text: d.name,
      regex:
        d.id > 0
          ? new RegExp(`^/admin/movies/${d.id}(?:/|$)`)
          : new RegExp(`^/admin/movies(?!/\\d)(?:/|$)`),
    }));
  }, [radarrInstances]);

  const sonarrTabs: AdminRoute[] = useMemo(() => {
    if (sonarrInstances.length <= 1) return [];
    return sonarrInstances.map((d) => ({
      route: `/admin/tv${d.id > 0 ? `/${d.id}` : ''}`,
      text: d.name,
      regex:
        d.id > 0
          ? new RegExp(`^/admin/tv/${d.id}(?:/|$)`)
          : new RegExp(`^/admin/tv(?!/\\d)(?:/|$)`),
    }));
  }, [sonarrInstances]);

  const getSettingsPathForRoute = (): string => {
    if (isMoviesRoute) return '/admin/settings/services/radarr';
    if (isTvRoute) return '/admin/settings/services/sonarr';
    if (pathname?.startsWith('/admin/music'))
      return '/admin/settings/services/lidarr';
    if (pathname?.startsWith('/admin/indexers'))
      return '/admin/settings/services/prowlarr';
    if (pathname?.startsWith('/admin/srt'))
      return '/admin/settings/services/bazarr';
    if (pathname?.startsWith('/admin/transcode'))
      return '/admin/settings/services/tdarr';
    return '/admin/settings/services';
  };

  const getServiceNameForRoute = (): string => {
    if (isMoviesRoute) return 'Radarr';
    if (isTvRoute) return 'Sonarr';
    if (pathname?.startsWith('/admin/music')) return 'Lidarr';
    if (pathname?.startsWith('/admin/indexers')) return 'Prowlarr';
    if (pathname?.startsWith('/admin/srt')) return 'Bazarr';
    if (pathname?.startsWith('/admin/transcode')) return 'Tdarr';
    return 'Service';
  };

  if (!hostname) return <LoadingEllipsis />;

  if (!activeFrame) {
    return (
      <ServiceNotConfigured
        serviceName={getServiceNameForRoute()}
        settingsPath={getSettingsPathForRoute()}
        isAdmin={isAdmin}
        isAdminRoute={true}
      />
    );
  }

  return (
    <div className="relative mt-2">
      {isMoviesRoute && radarrTabs.length > 0 && (
        <div className="m-4">
          <AdminTabs tabType="button" AdminRoutes={radarrTabs} />
        </div>
      )}
      {isTvRoute && sonarrTabs.length > 0 && (
        <div className="m-4">
          <AdminTabs tabType="button" AdminRoutes={sonarrTabs} />
        </div>
      )}
      <DynamicFrame
        key={activeFrame.id}
        title={activeFrame.title}
        domainURL={hostname}
        basePath={activeFrame.basePath}
        newBase={activeFrame.newBase}
        serviceName={activeFrame.serviceName}
        settingsPath={activeFrame.settingsPath}
        isConfigured={true}
      />
    </div>
  );
};

export default ServiceFrameContainer;
