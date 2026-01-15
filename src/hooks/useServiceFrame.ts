'use client';
import type {
  RadarrSettings,
  ServiceSettings,
  SonarrSettings,
} from '@server/lib/settings';
import { usePathname } from 'next/navigation';

export interface ServiceFrameConfig {
  id: string;
  basePath: string;
  newBase: string;
  title: string;
}

export interface UseServiceFrameResult {
  activeFrame: ServiceFrameConfig | null;
  isMoviesRoute: boolean;
  isTvRoute: boolean;
}

type RouteInfo = {
  serviceType:
    | 'radarr'
    | 'sonarr'
    | 'lidarr'
    | 'prowlarr'
    | 'bazarr'
    | 'tdarr'
    | 'downloads';
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
    { pattern: '/admin/downloads', type: 'downloads' as const },
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
    };
  }

  // Single-instance services
  const serviceMap: Record<string, { newBase: string; title: string }> = {
    lidarr: { newBase: '/admin/music', title: 'music' },
    prowlarr: { newBase: '/admin/indexers', title: 'indexers' },
    bazarr: { newBase: '/admin/srt', title: 'subtitles' },
    tdarr: { newBase: '/admin/transcode', title: 'transcoding' },
    downloads: { newBase: '/admin/downloads', title: 'downloads' },
  };

  const info = serviceMap[serviceType];
  if (!info) return null;

  const service = services.find((s) => s.id === serviceType);
  if (!service?.enabled || !service?.urlBase) return null;

  return {
    id: serviceType,
    basePath: service.urlBase,
    newBase: info.newBase,
    title: info.title,
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
