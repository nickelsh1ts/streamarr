'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import { useServiceFrame } from '@app/hooks/useServiceFrame';
import type {
  RadarrSettings,
  ServiceSettings,
  SonarrSettings,
} from '@server/lib/settings';
import { useMemo, useState } from 'react';

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

  if (!hostname) return <LoadingEllipsis />;

  if (!activeFrame) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-base-content/60">Service not configured</p>
      </div>
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
      />
    </div>
  );
};

export default ServiceFrameContainer;
