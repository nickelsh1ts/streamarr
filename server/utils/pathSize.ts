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

export interface DirectoryUsage {
  totalBytes: number;
  /** Used bytes keyed by the resolved path of each immediate child directory. */
  children: Map<string, number>;
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

/**
 * Measures a directory and each of its immediate child directories in a
 * single walk (`du -d 1`) instead of one walk per path.
 */
export const getDirectoryUsage = (
  targetPath: string,
  maxWaitMs = RECURSIVE_WALK_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<DirectoryUsage> =>
  diskScanQueue.enqueue(
    () => getDirectoryUsageUnqueued(path.resolve(targetPath), signal),
    maxWaitMs,
    signal
  );

const isDuUnavailable = (e: unknown) =>
  !!e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT';

const runDu = async (
  flags: string[],
  targetPath: string,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted();

  try {
    // `--` guards against a path that begins with `-` being read as a flag.
    const { stdout } = await execFileAsync('du', [...flags, '--', targetPath], {
      timeout: DU_TIMEOUT_MS,
      signal,
    });
    return stdout;
  } catch (e) {
    // du exits non-zero when some entries are unreadable but still prints totals.
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      typeof e.code === 'number' &&
      !('killed' in e && e.killed) &&
      'stdout' in e &&
      typeof e.stdout === 'string' &&
      e.stdout.trim()
    ) {
      return e.stdout;
    }

    throw e;
  }
};

const parseDuLines = (stdout: string) =>
  stdout.split('\n').flatMap((line) => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    return match
      ? [{ path: path.resolve(match[2]), bytes: Number(match[1]) * 1024 }]
      : [];
  });

const logDuFallback = (targetPath: string, e: unknown) =>
  logger.warn('du is unavailable; falling back to recursive path size walk', {
    label: 'PathSize',
    targetPath,
    errorMessage: e instanceof Error ? e.message : 'Unknown error',
  });

const getPathUsedBytesUnqueued = async (
  targetPath: string,
  signal?: AbortSignal
): Promise<number> => {
  let stdout: string;

  try {
    stdout = await runDu(['-sk'], targetPath, signal);
  } catch (e) {
    signal?.throwIfAborted();
    // A timed-out du means a JS walk would be slower still, so only fall back when du is missing.
    if (!isDuUnavailable(e)) throw e;
    logDuFallback(targetPath, e);
    return (await walkUsedBytes(targetPath, signal)).totalBytes;
  }

  const [entry] = parseDuLines(stdout);

  if (!entry) {
    throw new Error(`Unable to parse du output for path: ${targetPath}`);
  }

  return entry.bytes;
};

const getDirectoryUsageUnqueued = async (
  targetPath: string,
  signal?: AbortSignal
): Promise<DirectoryUsage> => {
  let stdout: string;

  try {
    stdout = await runDu(['-k', '-d', '1'], targetPath, signal);
  } catch (e) {
    signal?.throwIfAborted();
    if (!isDuUnavailable(e)) throw e;
    logDuFallback(targetPath, e);
    return walkUsedBytes(targetPath, signal);
  }

  const children = new Map<string, number>();
  let totalBytes: number | undefined;

  for (const entry of parseDuLines(stdout)) {
    if (entry.path === targetPath) totalBytes = entry.bytes;
    else children.set(entry.path, entry.bytes);
  }

  if (totalBytes === undefined) {
    throw new Error(`Unable to parse du output for path: ${targetPath}`);
  }

  return { totalBytes, children };
};

const walkUsedBytes = async (
  targetPath: string,
  signal?: AbortSignal
): Promise<DirectoryUsage> => {
  const deadline = Date.now() + RECURSIVE_WALK_TIMEOUT_MS;
  const children = new Map<string, number>();

  try {
    signal?.throwIfAborted();
    const rootStats = await fsPromises.lstat(targetPath);

    if (rootStats.isFile()) {
      return { totalBytes: rootStats.size, children };
    }

    if (!rootStats.isDirectory()) {
      return { totalBytes: 0, children };
    }
  } catch {
    signal?.throwIfAborted();
    return { totalBytes: 0, children };
  }

  let totalBytes = 0;
  let entriesSinceDeadlineCheck = 0;
  const stack: { dirPath: string; childKey?: string }[] = [
    { dirPath: targetPath },
  ];

  while (stack.length > 0) {
    signal?.throwIfAborted();
    if (Date.now() > deadline) {
      throw new PathSizeTimeoutError(targetPath);
    }

    const current = stack.pop();

    if (!current) {
      continue;
    }

    const { dirPath: currentPath, childKey } = current;
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
          const entryChildKey = childKey ?? entryPath;
          if (!childKey) children.set(entryPath, 0);
          stack.push({ dirPath: entryPath, childKey: entryChildKey });
        } else if (entryStats.isFile()) {
          totalBytes += entryStats.size;
          if (childKey) {
            children.set(
              childKey,
              (children.get(childKey) ?? 0) + entryStats.size
            );
          }
        }
      } catch {
        signal?.throwIfAborted();
        // Ignore unreadable entries and continue calculating what we can.
      }
    }

    signal?.throwIfAborted();
  }

  return { totalBytes, children };
};
