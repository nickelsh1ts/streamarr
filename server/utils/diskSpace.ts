import type {
  DiskSpaceFailure,
  DiskSpaceItem,
} from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import { getPathUsedBytes } from '@server/utils/pathSize';
import { execFile } from 'child_process';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const DF_TIMEOUT_MS = 10 * 1000;
const TARGET_TIMEOUT_MS = 45 * 1000;

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
  onTimeout?: () => void
): Promise<T> => {
  let timeout: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      onTimeout?.();
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
};

/**
 * Walks up the directory tree from `targetPath` until it finds a path that
 * exists on the filesystem. Returns the nearest existing ancestor (or the
 * root if nothing is found).
 */
export const getNearestExistingPath = async (
  targetPath: string
): Promise<string> => {
  let currentPath = path.resolve(targetPath);

  while (true) {
    try {
      await fsPromises.lstat(currentPath);
      return currentPath;
    } catch {
      const parentPath = path.dirname(currentPath);

      if (parentPath === currentPath) {
        return currentPath;
      }

      currentPath = parentPath;
    }
  }
};

/**
 * Returns disk usage statistics for the filesystem that contains `diskPath`.
 * Uses `df -Pk` for accuracy and falls back to `statfs` if unavailable.
 */
export const getDiskSpaceStats = async (diskPath: string) => {
  const statsPath = await getNearestExistingPath(diskPath);

  try {
    const { stdout } = await execFileAsync('df', ['-Pk', statsPath], {
      timeout: DF_TIMEOUT_MS,
    });
    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const statsLine = lines[lines.length - 1];

    const match = statsLine.match(
      /^(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+\d+%\s+(.+)$/
    );

    if (!match) {
      throw new Error(`Unable to parse df output for path: ${diskPath}`);
    }

    const [, filesystem, totalKb, usedKb, freeKb, mountPoint] = match;
    const totalBytes = Number(totalKb) * 1024;
    const usedBytes = Number(usedKb) * 1024;
    const freeBytes = Number(freeKb) * 1024;

    return {
      deviceId: filesystem,
      mountPoint,
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
    };
  } catch (e) {
    logger.warn('Falling back to statfs disk calculation', {
      label: 'Settings',
      diskPath,
      statsPath,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });

    const [stat, statfs] = await Promise.all([
      fsPromises.stat(statsPath),
      fsPromises.statfs(statsPath),
    ]);

    const totalBytes = statfs.bsize * statfs.blocks;
    const freeBytes = statfs.bsize * statfs.bavail;
    const usedBytes = totalBytes - freeBytes;

    return {
      deviceId: String(stat.dev),
      mountPoint: statsPath,
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
    };
  }
};

/**
 * Collects root filesystem capacity and explicit Streamarr directory sizes.
 * Failures per target are collected rather than thrown so callers always
 * receive a partial result.
 */
export const getConfigDiskSpace = async (
  configPath: string
): Promise<{ items: DiskSpaceItem[]; failedPaths: DiskSpaceFailure[] }> => {
  const cachePath = path.join(configPath, 'cache');
  const optionalPaths = [
    {
      kind: 'directory' as const,
      name: 'Cache',
      path: cachePath,
    },
    {
      kind: 'directory' as const,
      name: 'Logs',
      path: path.join(configPath, 'logs'),
    },
    {
      kind: 'directory' as const,
      name: 'Database',
      path: path.join(configPath, 'db'),
    },
  ];
  const existingOptionalPaths = await Promise.all(
    optionalPaths.map(async (target) => {
      try {
        await fsPromises.lstat(target.path);
        return target;
      } catch (e) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
          return undefined;
        }

        return target;
      }
    })
  );

  const diskPaths = [
    { kind: 'filesystem' as const, name: 'Root filesystem', path: '/' },
    { kind: 'directory' as const, name: 'Streamarr config', path: configPath },
    ...existingOptionalPaths.filter(
      (target): target is (typeof optionalPaths)[number] => target !== undefined
    ),
  ];

  const results = await Promise.all(
    diskPaths.map(async ({ kind, name, path: diskPath }) => {
      try {
        const diskStats = await withTimeout(
          getDiskSpaceStats(diskPath),
          TARGET_TIMEOUT_MS,
          `Timed out collecting filesystem stats for path: ${diskPath}`
        );
        const directoryBytes =
          kind === 'directory'
            ? await (() => {
                const controller = new AbortController();
                return withTimeout(
                  getPathUsedBytes(
                    diskPath,
                    TARGET_TIMEOUT_MS,
                    controller.signal
                  ),
                  TARGET_TIMEOUT_MS,
                  `Timed out calculating directory size for path: ${diskPath}`,
                  () => controller.abort()
                );
              })()
            : undefined;

        return {
          ok: true as const,
          value: {
            kind,
            deviceId: diskStats.deviceId,
            name,
            path: diskPath,
            mountPoint: diskStats.mountPoint,
            totalBytes: diskStats.totalBytes,
            freeBytes: diskStats.freeBytes,
            usedBytes: diskStats.usedBytes,
            usedPercent: diskStats.usedPercent,
            directoryBytes,
            directoryPercent:
              directoryBytes !== undefined && diskStats.totalBytes > 0
                ? (directoryBytes / diskStats.totalBytes) * 100
                : undefined,
          },
        };
      } catch (e) {
        logger.warn('Failed to collect disk usage stats', {
          label: 'Settings',
          diskPath,
          errorMessage: e instanceof Error ? e.message : 'Unknown error',
        });
        return { ok: false as const, value: { name, path: diskPath } };
      }
    })
  );

  return results.reduce<{
    items: DiskSpaceItem[];
    failedPaths: DiskSpaceFailure[];
  }>(
    (acc, r) => {
      if (r.ok) acc.items.push(r.value);
      else acc.failedPaths.push(r.value);
      return acc;
    },
    { items: [], failedPaths: [] }
  );
};

const DISK_SPACE_CACHE_TTL_MS = 30 * 1000;

type DiskSpaceResult = {
  items: DiskSpaceItem[];
  failedPaths: DiskSpaceFailure[];
  cachedAt: number;
};

let diskSpaceCache: {
  key: string;
  expiresAt: number;
  promise: Promise<DiskSpaceResult>;
} | null = null;

export const getCachedConfigDiskSpace = async (
  configPath: string,
  { force = false }: { force?: boolean } = {}
): Promise<DiskSpaceResult> => {
  const now = Date.now();

  if (
    !force &&
    diskSpaceCache &&
    diskSpaceCache.key === configPath &&
    diskSpaceCache.expiresAt > now
  ) {
    return diskSpaceCache.promise;
  }

  const promise = getConfigDiskSpace(configPath).then((result) => ({
    ...result,
    cachedAt: Date.now(),
  }));
  diskSpaceCache = {
    key: configPath,
    expiresAt: now + DISK_SPACE_CACHE_TTL_MS,
    promise,
  };

  promise.catch(() => {
    if (diskSpaceCache?.promise === promise) {
      diskSpaceCache = null;
    }
  });

  return promise;
};
