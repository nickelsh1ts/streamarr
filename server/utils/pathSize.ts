import logger from '@server/logger';
import { diskScanQueue } from '@server/utils/scanQueue';
import { execFile } from 'child_process';
import { promises as fsPromises } from 'fs';
import type { Dir } from 'node:fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const DU_TIMEOUT_MS = 30 * 1000;
const RECURSIVE_WALK_TIMEOUT_MS = 45 * 1000;
const DEADLINE_CHECK_INTERVAL = 200;

export class PathSizeTimeoutError extends Error {
  constructor(targetPath: string) {
    super(`Timed out calculating size for path: ${targetPath}`);
    this.name = 'PathSizeTimeoutError';
  }
}

export const getPathUsedBytes = (targetPath: string): Promise<number> =>
  diskScanQueue.enqueue(() => getPathUsedBytesUnqueued(targetPath));

const getPathUsedBytesUnqueued = async (
  targetPath: string
): Promise<number> => {
  try {
    // -s: summarize to a single total; -k: report in 1024-byte block units.
    // `--` guards against a path that begins with `-` being read as a flag.
    const { stdout } = await execFileAsync('du', ['-sk', '--', targetPath], {
      timeout: DU_TIMEOUT_MS,
    });
    const blocksKb = Number(stdout.trim().split(/\s+/)[0]);

    if (Number.isFinite(blocksKb)) {
      return blocksKb * 1024;
    }

    throw new Error(`Unable to parse du output for path: ${targetPath}`);
  } catch (e) {
    logger.warn('Falling back to recursive path size calculation', {
      label: 'PathSize',
      targetPath,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });

    return getPathUsedBytesRecursive(targetPath);
  }
};

const getPathUsedBytesRecursive = async (
  targetPath: string
): Promise<number> => {
  const deadline = Date.now() + RECURSIVE_WALK_TIMEOUT_MS;

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
  let entriesSinceDeadlineCheck = 0;
  const stack = [targetPath];

  while (stack.length > 0) {
    if (Date.now() > deadline) {
      throw new PathSizeTimeoutError(targetPath);
    }

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
      entriesSinceDeadlineCheck += 1;
      if (entriesSinceDeadlineCheck >= DEADLINE_CHECK_INTERVAL) {
        entriesSinceDeadlineCheck = 0;
        if (Date.now() > deadline) {
          throw new PathSizeTimeoutError(targetPath);
        }
      }

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
