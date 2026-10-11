import type {
  DiskSpaceFailure,
  DiskSpaceItem,
} from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import {
  getConfigDirectorySizes,
  getMeasuredDirectorySize,
  type DirectorySizes,
} from '@server/utils/directorySize';
import { promises as fsPromises } from 'fs';
import path from 'path';

const STATFS_TIMEOUT_MS = 10 * 1000;

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> => {
  let timeout: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
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

const unescapeMountPath = (value: string) =>
  value.replace(/\\([0-7]{3})/g, (_, octal: string) =>
    String.fromCharCode(parseInt(octal, 8))
  );

/**
 * Returns the longest mount-table entry containing `statsPath`, as df does,
 * so same-device bind mounts resolve to their own mount point.
 */
const getMountPointFromTable = async (statsPath: string) => {
  let mountinfo: string;

  try {
    mountinfo = await fsPromises.readFile('/proc/self/mountinfo', 'utf8');
  } catch {
    return undefined;
  }

  const realPath = await fsPromises.realpath(statsPath).catch(() => statsPath);
  let bestMatch: string | undefined;

  for (const line of mountinfo.split('\n')) {
    const rawMountPoint = line.split(' ')[4];

    if (!rawMountPoint) continue;

    const mountPoint = unescapeMountPath(rawMountPoint);
    const contains =
      mountPoint === '/' ||
      realPath === mountPoint ||
      realPath.startsWith(`${mountPoint}/`);

    if (contains && (!bestMatch || mountPoint.length > bestMatch.length)) {
      bestMatch = mountPoint;
    }
  }

  return bestMatch;
};

/**
 * Returns the highest ancestor of `statsPath` that is still on device `dev`.
 */
const getMountPointByDevice = async (statsPath: string, dev: number) => {
  let currentPath = statsPath;

  while (true) {
    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return currentPath;
    }

    try {
      if ((await fsPromises.stat(parentPath)).dev !== dev) {
        return currentPath;
      }
    } catch {
      return currentPath;
    }

    currentPath = parentPath;
  }
};

/**
 * Returns disk usage statistics for the filesystem that contains `diskPath`
 * using a single `statfs` syscall.
 */
export const getDiskSpaceStats = async (diskPath: string) => {
  const statsPath = await getNearestExistingPath(diskPath);
  const [stat, statfs] = await Promise.all([
    fsPromises.stat(statsPath),
    fsPromises.statfs(statsPath),
  ]);

  const totalBytes = statfs.bsize * statfs.blocks;
  const freeBytes = statfs.bsize * statfs.bavail;
  // Matches df: reserved blocks count as neither used nor free.
  const usedBytes = statfs.bsize * (statfs.blocks - statfs.bfree);

  return {
    deviceId: String(stat.dev),
    mountPoint:
      (await getMountPointFromTable(statsPath)) ??
      (await getMountPointByDevice(statsPath, stat.dev)),
    totalBytes,
    freeBytes,
    usedBytes,
    usedPercent: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
  };
};

/**
 * Collects root filesystem capacity and explicit Streamarr directory sizes.
 * Failures per target are collected rather than thrown so callers always
 * receive a partial result.
 */
export const getConfigDiskSpace = async (
  configPath: string,
  directorySizes: DirectorySizes | null,
  { directoriesPending = false }: { directoriesPending?: boolean } = {}
): Promise<{ items: DiskSpaceItem[]; failedPaths: DiskSpaceFailure[] }> => {
  const optionalPaths = [
    {
      kind: 'directory' as const,
      name: 'Cache',
      path: path.join(configPath, 'cache'),
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

  const getDirectoryBytes = (diskPath: string) =>
    directorySizes && !directorySizes.failed.has(path.resolve(diskPath))
      ? getMeasuredDirectorySize(directorySizes, diskPath)
      : undefined;

  const diskPaths = [
    { kind: 'filesystem' as const, name: 'Root filesystem', path: '/' },
    // Directory rows appear once the first background walk completes.
    ...(directoriesPending
      ? []
      : [
          {
            kind: 'directory' as const,
            name: 'Streamarr config',
            path: configPath,
          },
          ...existingOptionalPaths.filter(
            (target): target is (typeof optionalPaths)[number] =>
              target !== undefined
          ),
        ]),
  ];

  const results = await Promise.all(
    diskPaths.map(async ({ kind, name, path: diskPath }) => {
      try {
        const diskStats = await withTimeout(
          getDiskSpaceStats(diskPath),
          STATFS_TIMEOUT_MS,
          `Timed out collecting filesystem stats for path: ${diskPath}`
        );
        const directoryBytes =
          kind === 'directory' ? getDirectoryBytes(diskPath) : undefined;

        if (kind === 'directory' && directoryBytes === undefined) {
          throw new Error(`Directory size unavailable for path: ${diskPath}`);
        }

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

/**
 * Filesystem stats are read live on every call; directory sizes come from the
 * last background walk so the request never waits on a directory scan.
 */
export const getCachedConfigDiskSpace = async (
  configPath: string,
  { force = false }: { force?: boolean } = {}
) => {
  const { measured, measuredAt, refreshing } = getConfigDirectorySizes({
    force,
  });
  const result = await getConfigDiskSpace(configPath, measured, {
    directoriesPending: !measured,
  });

  // Report a missing measurement once rather than as a failure per directory row.
  if (!measured && !refreshing) {
    result.failedPaths.push({ name: 'Streamarr config', path: configPath });
  }

  return {
    ...result,
    cachedAt: measuredAt,
    refreshing,
  };
};
