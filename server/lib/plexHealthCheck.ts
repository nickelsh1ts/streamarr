import PlexAPI from '@server/api/plexapi';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

export type PlexHealthStatus = 'healthy' | 'retrying' | 'unhealthy';

export interface PlexHealthState {
  status: PlexHealthStatus;
  lastSuccess?: Date;
  lastFailure?: Date;
  lastError?: string;
  cooldownUntil?: Date;
  consecutiveFailures: number;
}

export interface LibraryLink {
  id: string;
  name: string;
  type: 'movie' | 'show' | 'artist' | 'live TV' | 'photo' | 'other';
  mediaCount: number;
  href: string;
  regExp: string;
  hasPlaylists: boolean;
}

export interface LibraryItemsResponse {
  machineId: string;
  enablePlaylists: boolean;
  defaultPivot: string;
  libraries: LibraryLink[];
}

let plexHealthState: PlexHealthState = {
  status: 'healthy',
  consecutiveFailures: 0,
};

let cachedLibraries: LibraryItemsResponse | undefined;
let retryTimeout: NodeJS.Timeout | undefined;
let revalidating = false;

export function getPlexHealth(): PlexHealthState {
  return { ...plexHealthState };
}

export function isPlexInCooldown(): boolean {
  if (!plexHealthState.cooldownUntil) return false;
  return new Date() < plexHealthState.cooldownUntil;
}

function scheduleRetry(): void {
  if (plexHealthState.consecutiveFailures === 1) {
    setPlexRetryTimeout(setTimeout(() => void revalidatePlexLibraries(), 5000));
  }
}

export async function withPlexHealth<T>(fn: () => Promise<T>): Promise<T> {
  if (isPlexInCooldown()) {
    throw new Error('Plex is in cooldown');
  }
  try {
    const result = await fn();
    markPlexHealthy();
    return result;
  } catch (e) {
    markPlexFailed(e instanceof Error ? e.message : String(e));
    scheduleRetry();
    throw e;
  }
}

function markPlexFailed(error: string): void {
  plexHealthState.lastFailure = new Date();
  plexHealthState.lastError = error;
  plexHealthState.consecutiveFailures += 1;

  if (plexHealthState.consecutiveFailures === 1) {
    plexHealthState.status = 'retrying';
    logger.warn('Plex unreachable, retrying in 5s', {
      label: 'Plex Health',
      error,
    });
  } else if (plexHealthState.consecutiveFailures >= 2) {
    plexHealthState.status = 'unhealthy';
    plexHealthState.cooldownUntil = new Date(Date.now() + 5 * 60 * 1000);
    logger.error('Plex unreachable, will retry in 5 minutes', {
      label: 'Plex Health',
      error,
    });
  }
}

export function markPlexHealthy(): void {
  const wasAffected = plexHealthState.status !== 'healthy';
  plexHealthState.status = 'healthy';
  plexHealthState.lastSuccess = new Date();
  plexHealthState.consecutiveFailures = 0;
  plexHealthState.lastError = undefined;
  plexHealthState.cooldownUntil = undefined;

  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = undefined;
  }

  if (wasAffected) {
    logger.debug('Plex connection restored', { label: 'Plex Health' });
  }
}

export function resetPlexHealth(): void {
  plexHealthState.status = 'healthy';
  plexHealthState.consecutiveFailures = 0;
  plexHealthState.lastError = undefined;
  plexHealthState.cooldownUntil = undefined;

  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = undefined;
  }
}

export function getPlexCachedLibraries(): LibraryItemsResponse | undefined {
  return cachedLibraries;
}

function setPlexCachedLibraries(data: LibraryItemsResponse): void {
  cachedLibraries = data;
}

function setPlexRetryTimeout(timeout: NodeJS.Timeout): void {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }
  retryTimeout = timeout;
}

export async function revalidatePlexLibraries(): Promise<void> {
  if (revalidating || isPlexInCooldown()) return;
  revalidating = true;
  const settings = getSettings();
  const userRepository = getRepository(User);
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });
    const plexApi = new PlexAPI({ plexToken: admin.plexToken });
    const machineId = settings.plex.machineId;
    const allEnabledLibraries = settings.plex.libraries.filter(
      (lib) => lib.enabled
    );

    await withPlexHealth(async () => {
      await plexApi.getStatus();

      const libraries = await Promise.all(
        allEnabledLibraries.map(async (lib) => {
          const [{ totalSize }, hasPlaylists] = await Promise.all([
            plexApi.getLibraryContents(lib.id, { size: 0 }),
            settings.plex.enablePlaylists
              ? plexApi.libraryHasPlaylists(lib.id)
              : Promise.resolve(false),
          ]);
          return {
            id: lib.id,
            name: lib.name,
            type: lib.type as LibraryLink['type'],
            mediaCount: totalSize,
            href: `/watch/web/index.html#!/media/${machineId}/com.plexapp.plugins.library?source=${lib.id}`,
            regExp: `source=${lib.id}&`,
            hasPlaylists,
          };
        })
      );

      setPlexCachedLibraries({
        machineId: machineId ?? '',
        enablePlaylists: settings.plex.enablePlaylists ?? false,
        defaultPivot: settings.plex.defaultPivot ?? 'library',
        libraries,
      });
    });
  } catch {
    // health state is managed by withPlexHealth
  } finally {
    revalidating = false;
  }
}
