import { clearClientCache, getClientVersion } from '@server/api/downloads/base';
import SeerrAPI from '@server/api/seerr';
import LidarrAPI from '@server/api/servarr/lidarr';
import ProwlarrAPI from '@server/api/servarr/prowlarr';
import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import TautulliAPI from '@server/api/tautulli';
import { getIntl } from '@server/i18n';
import type {
  ServiceHealth,
  ServiceHealthInstance,
  ServiceHealthStatus,
} from '@server/interfaces/api/settingsInterfaces';
import { getAudiobookshelfAPI } from '@server/lib/audiobookshelf';
import { resetClientHealth } from '@server/lib/healthCheck';
import { getPlexHealth, refreshPlexVersion } from '@server/lib/plexHealthCheck';
import type {
  AudiobookshelfSettings,
  DownloadClientSettings,
  DVRSettings,
  ServiceSettings,
} from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';

interface CheckResult {
  status: ServiceHealthStatus;
  version?: string;
  detail?: string;
  error?: string;
}

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Health check timed out')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

const isServiceConfigured = (service: ServiceSettings): boolean =>
  service.enabled === true && !!service.hostname;

function buildUrl(
  service: ServiceSettings,
  path: string,
  defaultPort: number
): URL {
  const protocol = service.useSsl ? 'https' : 'http';
  const base = String(service.urlBase ?? '')
    .split('/')
    .filter(Boolean)
    .join('/');
  return new URL(
    base ? `/${base}/${path}` : `/${path}`,
    `${protocol}://${service.hostname}:${service.port ?? defaultPort}`
  );
}

const aggregateStatus = (
  instances: ServiceHealthInstance[]
): ServiceHealthStatus => {
  if (instances.length === 0) return 'unknown';
  if (instances.some((i) => i.status === 'unhealthy')) return 'unhealthy';
  if (instances.some((i) => i.status === 'retrying')) return 'retrying';
  if (instances.every((i) => i.status === 'healthy')) return 'healthy';
  return 'unknown';
};

async function checkArr(api: {
  getSystemStatus: () => Promise<{ version: string }>;
}): Promise<CheckResult> {
  try {
    const status = await api.getSystemStatus();
    return { status: 'healthy', version: status.version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

interface CleanuparrStats {
  health?: {
    downloadClients?: unknown[];
    arrInstances?: unknown[];
  };
}

async function checkCleanuparr(service: ServiceSettings): Promise<CheckResult> {
  const intl = getIntl(getSettings().main.locale ?? 'en');
  try {
    const url = buildUrl(service, 'api/stats', 11011);
    url.searchParams.set('hours', '1');

    const response = await fetch(url, {
      headers: { 'X-Api-Key': service.apiKey ?? '' },
      signal: AbortSignal.timeout(getSettings().network.requestTimeout),
    });

    if (!response.ok) {
      throw new Error(`Cleanuparr responded with HTTP ${response.status}`);
    }

    // Cleanuparr does not expose an application version, so surface the number
    // of services it is monitoring as a useful health detail instead.
    const stats = (await response.json()) as CleanuparrStats;
    const monitored =
      (stats.health?.downloadClients?.length ?? 0) +
      (stats.health?.arrInstances?.length ?? 0);

    return {
      status: 'healthy',
      detail: intl.formatMessage(
        {
          id: 'system.service.monitoring',
          defaultMessage:
            'Monitoring {count, plural, one {# service} other {# services}}',
        },
        { count: monitored }
      ),
    };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

interface BazarrStatus {
  data?: { bazarr_version?: string };
}

async function checkBazarr(service: ServiceSettings): Promise<CheckResult> {
  try {
    const response = await fetch(buildUrl(service, 'api/system/status', 6767), {
      headers: {
        'X-API-KEY': service.apiKey ?? '',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeout()),
    });

    if (!response.ok) {
      throw new Error(`Bazarr responded with HTTP ${response.status}`);
    }

    const body = (await response.json()) as BazarrStatus;
    const version = body.data?.bazarr_version;
    if (!version) {
      throw new Error('Bazarr did not return a valid status response');
    }

    return { status: 'healthy', version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

interface TdarrStatus {
  status?: string;
  version?: string;
}

async function checkTdarr(service: ServiceSettings): Promise<CheckResult> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (service.apiKey) {
      headers['x-api-key'] = service.apiKey;
    }

    const response = await fetch(
      `${service.useSsl ? 'https' : 'http'}://${service.hostname}:${
        service.port ?? 8265
      }/api/v2/status`,
      {
        headers,
        signal: AbortSignal.timeout(timeout()),
      }
    );

    if (!response.ok) {
      throw new Error(`Tdarr responded with HTTP ${response.status}`);
    }

    const body = (await response.json()) as TdarrStatus;
    return { status: 'healthy', version: body.version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

async function checkTautulli(): Promise<CheckResult> {
  const tautulli = getSettings().tautulli;
  try {
    const info = await withTimeout(
      new TautulliAPI({ ...tautulli, port: tautulli.port ?? 8181 }).getInfo(),
      timeout()
    );
    return { status: 'healthy', version: info.tautulli_version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

async function checkAudiobookshelf(
  service: AudiobookshelfSettings
): Promise<CheckResult> {
  try {
    const version = await withTimeout(
      getAudiobookshelfAPI(service).getVersion(),
      timeout()
    );
    return { status: 'healthy', version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

async function checkSeerr(service: ServiceSettings): Promise<CheckResult> {
  try {
    const status = await withTimeout(
      new SeerrAPI({ ...service, port: service.port ?? 5055 }).getStatus(),
      timeout()
    );
    return { status: 'healthy', version: status.version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

async function checkDownloadClient(
  client: DownloadClientSettings
): Promise<CheckResult> {
  try {
    const version = await withTimeout(getClientVersion(client), timeout());
    return { status: 'healthy', version };
  } catch (e) {
    return { status: 'unhealthy', error: errorMessage(e) };
  }
}

const timeout = (): number => getSettings().network.requestTimeout;

async function checkArrInstances(
  prefix: string,
  instances: DVRSettings[],
  build: (instance: DVRSettings) => {
    getSystemStatus: () => Promise<{ version: string }>;
  }
): Promise<ServiceHealthInstance[]> {
  return Promise.all(
    instances.map(async (instance) => {
      const result = await checkArr(build(instance));
      return {
        id: `${prefix}-${instance.id}`,
        name: instance.name,
        ...result,
      } satisfies ServiceHealthInstance;
    })
  );
}

export async function getServicesHealth(): Promise<ServiceHealth[]> {
  const settings = getSettings();

  const tasks: Promise<ServiceHealth | null>[] = [
    (async (): Promise<ServiceHealth> => {
      await refreshPlexVersion();
      const plexHealth = getPlexHealth();
      return {
        id: 'plex',
        name: 'Plex',
        status: plexHealth.status,
        version: plexHealth.version,
        error: plexHealth.lastError,
        retryable: true,
      };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (settings.radarr.length === 0) return null;
      const instances = await checkArrInstances(
        'radarr',
        settings.radarr,
        (instance) =>
          new RadarrAPI({
            apiKey: instance.apiKey,
            url: RadarrAPI.buildUrl(instance, '/api/v3'),
            timeout: timeout(),
          })
      );
      return {
        id: 'radarr',
        name: 'Radarr',
        status: aggregateStatus(instances),
        retryable: true,
        instances,
      };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (settings.sonarr.length === 0) return null;
      const instances = await checkArrInstances(
        'sonarr',
        settings.sonarr,
        (instance) =>
          new SonarrAPI({
            apiKey: instance.apiKey,
            url: SonarrAPI.buildUrl(instance, '/api/v3'),
            timeout: timeout(),
          })
      );
      return {
        id: 'sonarr',
        name: 'Sonarr',
        status: aggregateStatus(instances),
        retryable: true,
        instances,
      };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.prowlarr)) return null;
      const result = await checkArr(
        new ProwlarrAPI({
          apiKey: settings.prowlarr.apiKey ?? '',
          url: ProwlarrAPI.buildServiceUrl(settings.prowlarr, '/api/v1'),
          timeout: timeout(),
        })
      );
      return { id: 'prowlarr', name: 'Prowlarr', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.lidarr)) return null;
      const result = await checkArr(
        new LidarrAPI({
          apiKey: settings.lidarr.apiKey ?? '',
          url: LidarrAPI.buildServiceUrl(settings.lidarr, '/api/v1'),
          timeout: timeout(),
        })
      );
      return { id: 'lidarr', name: 'Lidarr', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.bazarr)) return null;
      const result = await checkBazarr(settings.bazarr);
      return { id: 'bazarr', name: 'Bazarr', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.tdarr)) return null;
      const result = await checkTdarr(settings.tdarr);
      return { id: 'tdarr', name: 'Tdarr', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.cleanuparr)) return null;
      const result = await checkCleanuparr(settings.cleanuparr);
      return {
        id: 'cleanuparr',
        name: 'Cleanuparr',
        retryable: true,
        ...result,
      };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.audiobookshelf)) return null;
      const result = await checkAudiobookshelf(settings.audiobookshelf);
      return {
        id: 'audiobookshelf',
        name: 'Audiobookshelf',
        retryable: true,
        ...result,
      };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.tautulli as ServiceSettings))
        return null;
      const result = await checkTautulli();
      return { id: 'tautulli', name: 'Tautulli', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (!isServiceConfigured(settings.overseerr)) return null;
      const result = await checkSeerr(settings.overseerr);
      return { id: 'overseerr', name: 'Seerr', retryable: true, ...result };
    })(),

    (async (): Promise<ServiceHealth | null> => {
      if (settings.downloads.length === 0) return null;
      const instances = await Promise.all(
        settings.downloads.map(async (client) => {
          const result = await checkDownloadClient(client);
          return {
            id: `downloads-${client.id}`,
            name: client.name,
            ...result,
          } satisfies ServiceHealthInstance;
        })
      );
      return {
        id: 'downloads',
        name: 'Downloads',
        status: aggregateStatus(instances),
        retryable: true,
        instances,
      };
    })(),
  ];

  const results = await Promise.all(tasks);
  return results.filter(
    (service): service is ServiceHealth => service !== null
  );
}

export function resetServiceHealthState(id: string): void {
  if (id === 'downloads') {
    getSettings().downloads.forEach((client) => {
      resetClientHealth(client.id);
      clearClientCache(client.id);
    });
    return;
  }

  if (id.startsWith('downloads-')) {
    const clientId = Number(id.slice('downloads-'.length));
    if (Number.isInteger(clientId)) {
      resetClientHealth(clientId);
      clearClientCache(clientId);
    }
  }
}
