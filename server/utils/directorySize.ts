import logger from '@server/logger';
import { appDataPath } from '@server/utils/appDataVolume';
import { promises as fsPromises, type Dirent } from 'fs';
import path from 'path';

const BATCH_SIZE = 64;
const MAX_CONCURRENT_FS_OPS = 16;
// Records sizes from the config root (0) down to individual caches like cache/images/tmdb (3).
const TRACKED_DEPTH = 3;
const SIZE_TTL_MS = 5 * 60 * 1000;
// A walk still pending after this is presumed stuck on storage; it is reported, not replaced.
const STALLED_WALK_MS = 15 * 60 * 1000;

export interface DirectorySizes {
  sizes: Map<string, number>;
  /** Tracked directories that could not be read, so their sizes are incomplete. */
  failed: Set<string>;
}

type Limit = <T>(task: () => Promise<T>) => Promise<T>;

interface WalkContext extends DirectorySizes {
  limit: Limit;
}

const createLimit = (max: number): Limit => {
  let active = 0;
  const waiting: (() => void)[] = [];

  return async (task) => {
    if (active >= max) await new Promise<void>((r) => waiting.push(r));
    else active += 1;

    try {
      return await task();
    } finally {
      // Hand the slot straight to the next waiter so `active` never overshoots.
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    }
  };
};

const isErrorCode = (e: unknown, code: string) =>
  !!e && typeof e === 'object' && 'code' in e && e.code === code;

const measureEntry = async (
  entryPath: string,
  entry: Dirent,
  depth: number,
  ctx: WalkContext
): Promise<number> => {
  if (entry.isDirectory()) return walk(entryPath, depth + 1, ctx);

  const isKnownNonFile =
    entry.isSymbolicLink() ||
    entry.isBlockDevice() ||
    entry.isCharacterDevice() ||
    entry.isFIFO() ||
    entry.isSocket();

  if (isKnownNonFile) return 0;

  // Some network/FUSE filesystems report DT_UNKNOWN, so the type comes from lstat.
  try {
    const stat = await ctx.limit(() => fsPromises.lstat(entryPath));
    if (stat.isDirectory()) return walk(entryPath, depth + 1, ctx);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
};

/** Apparent-size walk image cache calculation. */
const walk = async (
  dir: string,
  depth: number,
  ctx: WalkContext
): Promise<number> => {
  let entries: Dirent[];

  try {
    entries = await ctx.limit(() =>
      fsPromises.readdir(dir, { withFileTypes: true })
    );
  } catch (e) {
    if (depth === 0) throw e;
    // A directory removed mid-walk is genuinely empty; anything else is unmeasured.
    if (depth <= TRACKED_DEPTH && !isErrorCode(e, 'ENOENT')) {
      ctx.failed.add(dir);
    }
    return 0;
  }

  let total = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = await Promise.all(
      entries
        .slice(i, i + BATCH_SIZE)
        .map((entry) =>
          measureEntry(path.join(dir, entry.name), entry, depth, ctx)
        )
    );

    total += batch.reduce((sum, size) => sum + size, 0);
  }

  if (depth <= TRACKED_DEPTH) ctx.sizes.set(dir, total);

  return total;
};

let latest: (DirectorySizes & { measuredAt: number }) | null = null;
let running: { startedAt: number; stallReported: boolean } | null = null;
let lastAttemptAt = 0;

const startWalk = () => {
  const root = path.resolve(appDataPath());
  const result: DirectorySizes = { sizes: new Map(), failed: new Set() };

  running = { startedAt: Date.now(), stallReported: false };
  lastAttemptAt = running.startedAt;

  walk(root, 0, { ...result, limit: createLimit(MAX_CONCURRENT_FS_OPS) })
    .then(() => {
      latest = { ...result, measuredAt: Date.now() };
    })
    .catch((e) => {
      logger.warn('Failed to calculate config directory sizes', {
        label: 'Settings',
        diskPath: root,
        errorMessage: e instanceof Error ? e.message : 'Unknown error',
      });
    })
    .finally(() => {
      running = null;
    });
};

/**
 * Returns the last measured config directory sizes without waiting on disk.
 * A background walk is started when the result is stale or `force` is set.
 */
export const getConfigDirectorySizes = ({
  force = false,
}: { force?: boolean } = {}): {
  measured: DirectorySizes | null;
  measuredAt: number | null;
  refreshing: boolean;
} => {
  const now = Date.now();
  const isStale = !latest || now - latest.measuredAt > SIZE_TTL_MS;
  // Backs off failed walks instead of retrying on every poll.
  const canRetry = now - lastAttemptAt > SIZE_TTL_MS;

  // Pending syscalls cannot be cancelled, so a replacement would only queue behind them.
  if (!running && (force || (isStale && canRetry))) {
    startWalk();
  }

  const isStalled = !!running && now - running.startedAt >= STALLED_WALK_MS;

  if (running && isStalled && !running.stallReported) {
    running.stallReported = true;
    logger.warn('Config directory size calculation appears stuck on storage', {
      label: 'Settings',
      diskPath: path.resolve(appDataPath()),
      runningForMs: now - running.startedAt,
    });
  }

  return {
    measured: latest,
    measuredAt: latest?.measuredAt ?? null,
    refreshing: !!running && !isStalled,
  };
};

export const getMeasuredDirectorySize = (
  measured: DirectorySizes | null,
  dirPath: string
) => measured?.sizes.get(path.resolve(dirPath)) ?? 0;
