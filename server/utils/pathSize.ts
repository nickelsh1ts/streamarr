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

export const getPathUsedBytes = (
  targetPath: string,
  maxWaitMs = RECURSIVE_WALK_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<number> =>
  diskScanQueue.enqueue(
    () => getPathUsedBytesUnqueued(targetPath, signal),
    maxWaitMs,
    signal
  );

const getPathUsedBytesUnqueued = async (
  targetPath: string,
  signal?: AbortSignal
): Promise<number> => {
  try {
    signal?.throwIfAborted();
    // -s: summarize to a single total; -k: report in 1024-byte block units.
    // `--` guards against a path that begins with `-` being read as a flag.
    const { stdout } = await execFileAsync('du', ['-sk', '--', targetPath], {
      timeout: DU_TIMEOUT_MS,
      signal,
    });
    const blocksKb = Number(stdout.trim().split(/\s+/)[0]);

    if (Number.isFinite(blocksKb)) {
      return blocksKb * 1024;
    }

    throw new Error(`Unable to parse du output for path: ${targetPath}`);
  } catch (e) {
    signal?.throwIfAborted();
    logger.warn('Falling back to recursive path size calculation', {
      label: 'PathSize',
      targetPath,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });

    return getPathUsedBytesRecursive(targetPath, signal);
  }
};

const getPathUsedBytesRecursive = async (
  targetPath: string,
  signal?: AbortSignal
): Promise<number> => {
  const deadline = Date.now() + RECURSIVE_WALK_TIMEOUT_MS;

  try {
    signal?.throwIfAborted();
    const rootStats = await fsPromises.lstat(targetPath);

    if (rootStats.isFile()) {
      return rootStats.size;
    }

    if (!rootStats.isDirectory()) {
      return 0;
    }
  } catch {
    signal?.throwIfAborted();
    return 0;
  }

  let totalBytes = 0;
  let entriesSinceDeadlineCheck = 0;
  const stack = [targetPath];

  while (stack.length > 0) {
    signal?.throwIfAborted();
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
      signal?.throwIfAborted();
      continue;
    }

    for await (const entry of dir) {
      signal?.throwIfAborted();
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
        signal?.throwIfAborted();
        // Ignore unreadable entries and continue calculating what we can.
      }
    }

    signal?.throwIfAborted();
  }

  return totalBytes;
};
