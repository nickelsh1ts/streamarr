import type {
  DiskSpaceFailure,
  DiskSpaceItem,
} from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import { execFile } from 'child_process';
import { promises as fsPromises } from 'fs';
import type { Dir } from 'node:fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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
    const { stdout } = await execFileAsync('df', ['-Pk', statsPath]);
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
 * Recursively calculates the total size in bytes of all files under
 * `targetPath`. Skips symbolic links and unreadable entries.
 */
export const getPathUsedBytes = async (targetPath: string): Promise<number> => {
  try {
    const rootStats = await fsPromises.lstat(targetPath);

    if (rootStats.isFile()) {
      return rootStats.size;
    }

    if (!rootStats.isDirectory()) {
      return 0;
    }
  } catch {
    return 0;
  }

  let totalBytes = 0;
  const stack = [targetPath];

  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (!currentPath) {
      continue;
    }

    let dir: Dir;

    try {
      dir = await fsPromises.opendir(currentPath);
    } catch {
      continue;
    }

    for await (const entry of dir) {
      const entryPath = path.join(currentPath, entry.name);

      try {
        const entryStats = await fsPromises.lstat(entryPath);

        if (entryStats.isSymbolicLink()) {
          continue;
        }

        if (entryStats.isDirectory()) {
          stack.push(entryPath);
        } else if (entryStats.isFile()) {
          totalBytes += entryStats.size;
        }
      } catch {
        // Ignore unreadable entries and continue calculating what we can.
      }
    }
  }

  return totalBytes;
};

/**
 * Collects disk usage stats for the app config directory and all of its
 * immediate subdirectories. Failures per-path are collected rather than
 * thrown so callers always receive a partial result.
 */
export const getConfigDiskSpace = async (
  configPath: string
): Promise<{ items: DiskSpaceItem[]; failedPaths: DiskSpaceFailure[] }> => {
  let subfolderPaths: { name: string; path: string }[] = [];

  try {
    const entries = await fsPromises.readdir(configPath, {
      withFileTypes: true,
    });
    subfolderPaths = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(configPath, entry.name),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  } catch (e) {
    logger.warn('Failed to enumerate config subfolders for disk stats', {
      label: 'Settings',
      configPath,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  const diskPaths = [{ name: 'App Data', path: configPath }, ...subfolderPaths];

  const results = await Promise.all(
    diskPaths.map(async ({ name, path: diskPath }) => {
      try {
        const [diskStats, pathUsedBytes] = await Promise.all([
          getDiskSpaceStats(diskPath),
          getPathUsedBytes(diskPath),
        ]);
        return {
          ok: true as const,
          value: {
            deviceId: diskStats.deviceId,
            name,
            path: diskPath,
            mountPoint: diskStats.mountPoint,
            pathUsedBytes,
            totalBytes: diskStats.totalBytes,
            freeBytes: diskStats.freeBytes,
            usedBytes: diskStats.usedBytes,
            usedPercent: diskStats.usedPercent,
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
