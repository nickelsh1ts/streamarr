'use client';
import type {
  RadarrSettings,
  ServiceSettings,
  SonarrSettings,
} from '@server/lib/settings';
import { usePathname } from 'next/navigation';

export type ServiceType =
  | 'radarr'
  | 'sonarr'
  | 'lidarr'
  | 'prowlarr'
  | 'bazarr'
  | 'tdarr';

export interface ServiceFrameConfig {
  id: string;
  basePath: string;
  newBase: string;
  title: string;
  serviceName: string;
  settingsPath: string;
  serviceType: ServiceType;
}

export interface UseServiceFrameResult {
  activeFrame: ServiceFrameConfig | null;
  isMoviesRoute: boolean;
  isTvRoute: boolean;
}

type RouteInfo = {
  serviceType: ServiceType;
  instanceId: number;
  isMovies: boolean;
  isTv: boolean;
} | null;

function parseRoute(pathname: string): RouteInfo {
  const moviesMatch = pathname.match(/^\/admin\/movies(?:\/(\d+))?(?:\/|$)/);
  if (moviesMatch) {
    return {
      serviceType: 'radarr',
      instanceId: moviesMatch[1] ? parseInt(moviesMatch[1], 10) : 0,
      isMovies: true,
      isTv: false,
    };
  }

  const tvMatch = pathname.match(/^\/admin\/tv(?:\/(\d+))?(?:\/|$)/);
  if (tvMatch) {
    return {
      serviceType: 'sonarr',
      instanceId: tvMatch[1] ? parseInt(tvMatch[1], 10) : 0,
      isMovies: false,
      isTv: true,
    };
  }

  const singleServices = [
    { pattern: '/admin/music', type: 'lidarr' as const },
    { pattern: '/admin/indexers', type: 'prowlarr' as const },
    { pattern: '/admin/srt', type: 'bazarr' as const },
    { pattern: '/admin/transcode', type: 'tdarr' as const },
  ];

  for (const { pattern, type } of singleServices) {
    if (pathname.startsWith(pattern)) {
      return {
        serviceType: type,
        instanceId: 0,
        isMovies: false,
        isTv: false,
      };
    }
  }

  return null;
}

function getActiveFrame(
  routeInfo: RouteInfo,
  services: ServiceSettings[],
  radarrInstances: RadarrSettings[],
  sonarrInstances: SonarrSettings[]
): ServiceFrameConfig | null {
  if (!routeInfo) return null;

  const { serviceType, instanceId } = routeInfo;

  // Multi-instance: Radarr
  if (serviceType === 'radarr') {
    const instance =
      radarrInstances.find((r) => r.id === instanceId) ??
      radarrInstances.find((r) => r.isDefault) ??
      radarrInstances[0];
    if (!instance?.baseUrl) return null;

    return {
      id: `radarr-${instance.id}`,
      basePath: instance.baseUrl,
      newBase: `/admin/movies${instance.id > 0 ? `/${instance.id}` : ''}`,
      title: `movies-${instance.name}`,
      serviceName: instance.name || 'Radarr',
      settingsPath: '/admin/settings/services/radarr',
      serviceType: 'radarr',
    };
  }

  // Multi-instance: Sonarr
  if (serviceType === 'sonarr') {
    const instance =
      sonarrInstances.find((s) => s.id === instanceId) ??
      sonarrInstances.find((s) => s.isDefault) ??
      sonarrInstances[0];
    if (!instance?.baseUrl) return null;

    return {
      id: `sonarr-${instance.id}`,
      basePath: instance.baseUrl,
      newBase: `/admin/tv${instance.id > 0 ? `/${instance.id}` : ''}`,
      title: `tvshows-${instance.name}`,
      serviceName: instance.name || 'Sonarr',
      settingsPath: '/admin/settings/services/sonarr',
      serviceType: 'sonarr',
    };
  }

  // Single-instance services with configurable urlBase
  const serviceMap: Record<
    string,
    {
      newBase: string;
      title: string;
      serviceName: string;
      settingsPath: string;
    }
  > = {
    lidarr: {
      newBase: '/admin/music',
      title: 'music',
      serviceName: 'Lidarr',
      settingsPath: '/admin/settings/services/lidarr',
    },
    prowlarr: {
      newBase: '/admin/indexers',
      title: 'indexers',
      serviceName: 'Prowlarr',
      settingsPath: '/admin/settings/services/prowlarr',
    },
    bazarr: {
      newBase: '/admin/srt',
      title: 'subtitles',
      serviceName: 'Bazarr',
      settingsPath: '/admin/settings/services/bazarr',
    },
  };

  // Tdarr has hardcoded path (no base URL support)
  if (serviceType === 'tdarr') {
    const service = services.find((s) => s.id === 'tdarr');
    if (!service?.enabled) return null;
    return {
      id: 'tdarr',
      basePath: '/tdarr',
      newBase: '/admin/transcode',
      title: 'transcoding',
      serviceName: 'Tdarr',
      settingsPath: '/admin/settings/services/tdarr',
      serviceType: 'tdarr',
    };
  }

  const info = serviceMap[serviceType];
  if (!info) return null;

  const service = services.find((s) => s.id === serviceType);
  if (!service?.enabled || !service?.urlBase) return null;

  return {
    id: serviceType,
    basePath: service.urlBase,
    newBase: info.newBase,
    title: info.title,
    serviceName: info.serviceName,
    settingsPath: info.settingsPath,
    serviceType: serviceType as ServiceFrameConfig['serviceType'],
  };
}

/**
 * Determines which service iframe to display based on the current route.
 */
export function useServiceFrame(
  services: ServiceSettings[],
  radarrInstances: RadarrSettings[],
  sonarrInstances: SonarrSettings[]
): UseServiceFrameResult {
  const pathname = usePathname() ?? '';

  const routeInfo = parseRoute(pathname);
  const activeFrame = getActiveFrame(
    routeInfo,
    services,
    radarrInstances,
    sonarrInstances
  );

  return {
    activeFrame,
    isMoviesRoute: routeInfo?.isMovies ?? false,
    isTvRoute: routeInfo?.isTv ?? false,
  };
}
