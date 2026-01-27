/* eslint-disable @typescript-eslint/consistent-type-imports */
// Use dynamic imports for ESM-only packages to support CommonJS output
import type { AllClientData, NormalizedTorrent } from '@ctrl/shared-torrent';
import type { DownloadClientSettings } from '@server/lib/settings';
import type {
  NormalizedDownloadItem,
  AddTorrentRequest,
  CategoryManagementRequest,
  TorrentFile,
  UpdateTorrentRequest,
  SetFilePriorityRequest,
} from '@server/interfaces/api/downloadsInterfaces';
import logger from '@server/logger';

// Type imports for client classes
type QBittorrent = import('@ctrl/qbittorrent').QBittorrent;
type Deluge = import('@ctrl/deluge').Deluge;
type Transmission = import('@ctrl/transmission').Transmission;

// qBittorrent raw torrent response fields
interface QBittorrentRawTorrent {
  state: string;
  priority?: number;
  eta?: number;
  seeding_time?: number;
  seeding_time_limit?: number;
  ratio?: number;
  ratio_limit?: number;
  upspeed?: number;
  size?: number;
  seen_complete?: number; // Unix timestamp
  [key: string]: unknown;
}

// Client instance cache (in-memory, per-process)
const clientInstances = new Map<number, QBittorrent | Deluge | Transmission>();

/**
 * Create or retrieve cached download client instance
 * Uses dynamic imports for ESM-only packages
 */
async function getClient(
  settings: DownloadClientSettings
): Promise<QBittorrent | Deluge | Transmission> {
  // Check cache first
  if (clientInstances.has(settings.id)) {
    return clientInstances.get(settings.id)!;
  }

  const baseUrl = `${settings.useSsl ? 'https' : 'http'}://${settings.hostname}:${settings.port}`;
  let client: QBittorrent | Deluge | Transmission;

  switch (settings.client) {
    case 'qbittorrent': {
      const { QBittorrent } = await import('@ctrl/qbittorrent');
      client = new QBittorrent({
        baseUrl,
        username: settings.username,
        password: settings.password,
      });
      break;
    }
    case 'deluge': {
      const { Deluge } = await import('@ctrl/deluge');
      client = new Deluge({
        baseUrl,
        username: settings.username,
        password: settings.password,
      });
      break;
    }
    case 'transmission': {
      const { Transmission } = await import('@ctrl/transmission');
      client = new Transmission({
        baseUrl,
        username: settings.username,
        password: settings.password,
      });
      break;
    }
  }

  clientInstances.set(settings.id, client);
  return client;
}

/**
 * Clear cached client instance (useful for config changes)
 */
export function clearClientCache(clientId: number): void {
  clientInstances.delete(clientId);
}

/**
 * Test connection to a download client
 */
export async function testConnection(
  settings: DownloadClientSettings
): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    // Clear cache to force new connection
    clearClientCache(settings.id);
    const client = await getClient(settings);

    // getAllData is the most reliable way to test connectivity across all clients
    await client.getAllData();

    return {
      connected: true,
      version: 'Connected',
    };
  } catch (e) {
    logger.error(`Failed to connect to ${settings.name}`, {
      label: 'Downloads API',
      client: settings.client,
      error: e.message,
    });

    return {
      connected: false,
      error: e.message,
    };
  }
}

/**
 * Fetch all torrent data from a single client
 */
export async function fetchClientData(
  settings: DownloadClientSettings
): Promise<(AllClientData & { queueingEnabled?: boolean }) | null> {
  try {
    const client = await getClient(settings);
    const data = await client.getAllData();

    // For qBittorrent, check if queueing is enabled
    let queueingEnabled: boolean | undefined;
    if (settings.client === 'qbittorrent') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qbtClient = client as any;
        const preferences = await qbtClient.getPreferences();
        // qBittorrent queuing is enabled if queueing_enabled is true
        queueingEnabled = preferences?.queueing_enabled === true;
      } catch (e) {
        logger.debug('Failed to fetch qBittorrent preferences', {
          label: 'Downloads API',
          error: e.message,
        });
      }
    }

    return { ...data, queueingEnabled };
  } catch (e) {
    logger.warn(`Failed to fetch data from ${settings.name}`, {
      label: 'Downloads API',
      client: settings.client,
      error: e.message,
    });
    return null;
  }
}

/**
 * Map @ctrl/shared-torrent state to our normalized status
 */
function mapTorrentState(
  state: NormalizedTorrent['state'],
  rawState?: string
): NormalizedDownloadItem['status'] {
  // For qBittorrent, use the raw state for better accuracy
  if (rawState) {
    const qbtStateMap: Record<string, NormalizedDownloadItem['status']> = {
      // Downloading states
      downloading: 'downloading',
      metaDL: 'metadata',
      allocating: 'downloading',
      // Paused states
      pausedDL: 'paused',
      pausedUP: 'completed',
      // Seeding states
      uploading: 'seeding',
      stalledUP: 'seeding',
      queuedUP: 'seeding',
      checkingUP: 'checking',
      forcedUP: 'seeding',
      // Other states
      stalledDL: 'stalled',
      queuedDL: 'queued',
      checkingDL: 'checking',
      forcedDL: 'downloading',
      checkingResumeData: 'checking',
      moving: 'moving',
      missingFiles: 'error',
      error: 'error',
    };
    const mapped = qbtStateMap[rawState];
    if (mapped) return mapped;
  }

  // Fallback to normalized state mapping
  const stateMap: Record<string, NormalizedDownloadItem['status']> = {
    downloading: 'downloading',
    seeding: 'seeding',
    paused: 'paused',
    queued: 'queued',
    checking: 'checking',
    error: 'error',
    completed: 'completed',
  };
  return stateMap[state] || 'queued';
}

/**
 * Normalize torrent data from @ctrl libraries to our format
 */
export function normalizeTorrent(
  torrent: NormalizedTorrent,
  clientSettings: DownloadClientSettings,
  queueingEnabled?: boolean
): NormalizedDownloadItem {
  // Extract raw qBittorrent state for accurate status mapping
  const rawQbtState =
    clientSettings.client === 'qbittorrent' &&
    torrent.raw &&
    typeof torrent.raw === 'object' &&
    'state' in torrent.raw
      ? (torrent.raw as { state: string }).state
      : undefined;

  const status = mapTorrentState(torrent.state, rawQbtState);

  // Calculate ETA, handling seeding time for qBittorrent
  let etaValue = torrent.eta;
  let lastSeenCompleteValue: string | undefined = undefined;

  // Capture last seen complete for qBittorrent (all statuses)
  if (
    clientSettings.client === 'qbittorrent' &&
    torrent.raw &&
    typeof torrent.raw === 'object'
  ) {
    const raw = torrent.raw as QBittorrentRawTorrent;
    if (raw.seen_complete && raw.seen_complete > 0) {
      lastSeenCompleteValue = new Date(raw.seen_complete * 1000).toISOString();
    }
  }

  // For qBittorrent seeding torrents, calculate ETA based on share limits
  if (
    clientSettings.client === 'qbittorrent' &&
    torrent.raw &&
    typeof torrent.raw === 'object' &&
    (status === 'seeding' || status === 'completed')
  ) {
    const raw = torrent.raw as QBittorrentRawTorrent;

    // Check time-based seeding limit
    if (raw.seeding_time_limit && raw.seeding_time_limit > 0) {
      const currentSeedingTime = raw.seeding_time || 0;
      const remainingTime = raw.seeding_time_limit - currentSeedingTime;
      etaValue = Math.max(0, remainingTime);
    }
    // Check ratio-based seeding limit
    else if (raw.ratio_limit && raw.ratio_limit > 0) {
      const currentRatio = raw.ratio || 0;
      const remainingRatio = raw.ratio_limit - currentRatio;

      if (remainingRatio > 0 && raw.upspeed > 0) {
        // Calculate bytes needed to reach ratio limit
        const totalSize = raw.size || torrent.totalSelected;
        const bytesNeeded = remainingRatio * totalSize;
        etaValue = Math.floor(bytesNeeded / raw.upspeed);
      } else if (remainingRatio <= 0) {
        // Ratio limit already reached
        etaValue = 0;
      }
    }
    // Use raw ETA if it's not the magic "infinity" number (8640000 = 100 days)
    else if (raw.eta && raw.eta !== 8640000 && raw.eta > 0) {
      etaValue = raw.eta;
    }
  }

  return {
    id: `${clientSettings.id}-${torrent.id}`,
    hash: torrent.id,
    name: torrent.name,
    clientId: clientSettings.id,
    clientName: clientSettings.name,
    clientType: clientSettings.client,
    size: torrent.totalSelected,
    progress: torrent.progress * 100, // Convert from decimal (0.0-1.0) to percentage (0-100)
    downloadSpeed: torrent.downloadSpeed,
    uploadSpeed: torrent.uploadSpeed,
    eta: etaValue,
    status: status,
    ratio: torrent.ratio,
    addedDate: torrent.dateAdded,
    completedDate:
      torrent.dateCompleted && new Date(torrent.dateCompleted).getTime() > 0
        ? torrent.dateCompleted
        : undefined,
    lastSeenComplete: lastSeenCompleteValue,
    savePath: torrent.savePath || '',
    category: torrent.label,
    tags: [],
    seeds: torrent.connectedSeeds || 0,
    peers: torrent.connectedPeers || 0,
    totalSeeds: torrent.totalSeeds,
    totalPeers: torrent.totalPeers,
    priority:
      torrent.raw &&
      typeof torrent.raw === 'object' &&
      'priority' in torrent.raw
        ? // If queueing is explicitly disabled for qBittorrent, override to -1
          clientSettings.client === 'qbittorrent' && queueingEnabled === false
          ? -1
          : (torrent.raw as { priority: number }).priority
        : undefined,
  };
}

/**
 * Perform action on a torrent
 */
export async function performTorrentAction(
  settings: DownloadClientSettings,
  hash: string,
  action: string,
  options?: Record<string, unknown>
): Promise<boolean> {
  try {
    const client = await getClient(settings);

    switch (action) {
      case 'pause':
        await client.pauseTorrent(hash);
        break;
      case 'resume':
        await client.resumeTorrent(hash);
        break;
      case 'remove':
        const deleteFiles =
          typeof options?.deleteFiles === 'boolean'
            ? options.deleteFiles
            : false;
        if (deleteFiles) {
          logger.warn('Removing torrent with file deletion', {
            label: 'Downloads API',
            hash,
            client: settings.name,
          });
        }
        await client.removeTorrent(hash, deleteFiles);
        break;
      case 'forceRecheck':
        // Not all clients support this via normalized API
        if (settings.client === 'qbittorrent') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).recheckTorrent(hash);
        } else if (settings.client === 'transmission') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).verifyTorrent(hash);
        } else if (settings.client === 'deluge') {
          logger.warn('Force recheck not supported for Deluge', {
            label: 'Downloads API',
          });
          return false;
        }
        break;
      case 'queueUp':
      case 'queueDown':
      case 'topPriority':
      case 'bottomPriority':
        if (settings.client === 'qbittorrent') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const qbtClient = client as any;

          try {
            switch (action) {
              case 'queueUp':
                await qbtClient.queueUp(hash);
                break;
              case 'queueDown':
                await qbtClient.queueDown(hash);
                break;
              case 'topPriority':
                await qbtClient.topPriority(hash);
                break;
              case 'bottomPriority':
                await qbtClient.bottomPriority(hash);
                break;
            }
          } catch (e) {
            const errorMsg = e.message;
            // 409 Conflict means torrent is already at desired position or ATM is enabled
            if (!errorMsg.includes('409')) {
              throw e;
            }
          }
        } else {
          logger.warn('Queue management only supported for qBittorrent', {
            label: 'Downloads API',
            clientType: settings.client,
          });
          return false;
        }
        break;
      default:
        logger.warn(`Unknown action: ${action}`, {
          label: 'Downloads API',
        });
        return false;
    }

    return true;
  } catch (e) {
    logger.error(`Failed to ${action} torrent`, {
      label: 'Downloads API',
      client: settings.name,
      torrent: hash,
      error: e.message,
    });
    return false;
  }
}

/**
 * Add a new torrent
 */
export async function addTorrent(
  settings: DownloadClientSettings,
  options: AddTorrentRequest
): Promise<boolean> {
  try {
    const client = await getClient(settings);

    // Prepare add options
    const addOptions: {
      startPaused: boolean;
      label?: string;
      downloadDir?: string;
    } = {
      startPaused: options.paused || false,
    };

    if (options.category) {
      addOptions.label = options.category;
    }

    if (options.savePath) {
      addOptions.downloadDir = options.savePath;
    }

    // Add via magnet/URL or file
    if (options.torrent) {
      await client.normalizedAddTorrent(options.torrent, addOptions);
    } else if (options.file) {
      // Decode base64 file
      const torrentBuffer = Buffer.from(options.file, 'base64');
      try {
        await client.normalizedAddTorrent(torrentBuffer, addOptions);
      } catch (e) {
        const errorMsg = e.message;
        if (
          !errorMsg.includes('Torrent not found') &&
          !errorMsg.includes('404')
        ) {
          // Re-throw if it's a different error
          throw e;
        }
        // Otherwise silently ignore - torrent was added successfully despite the error
      }
    } else {
      throw new Error('Either torrent URL or file must be provided');
    }

    return true;
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Manage categories (qBittorrent only for now)
 */
export async function manageCategory(
  settings: DownloadClientSettings,
  options: CategoryManagementRequest
): Promise<boolean> {
  try {
    if (settings.client !== 'qbittorrent') {
      logger.warn('Category management only supported for qBittorrent', {
        label: 'Downloads API',
      });
      return false;
    }

    const client = (await getClient(settings)) as QBittorrent;

    switch (options.action) {
      case 'create':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).createCategory(
          options.category,
          options.savePath
        );
        break;
      case 'edit':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).editCategory(options.category, options.savePath);
        break;
      case 'delete':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).removeCategory([options.category]);
        break;
      default:
        return false;
    }

    return true;
  } catch (e) {
    logger.error(`Failed to ${options.action} category`, {
      label: 'Downloads API',
      client: settings.name,
      error: e.message,
    });
    return false;
  }
}

/**
 * Get torrent files list
 */
export async function getTorrentFiles(
  settings: DownloadClientSettings,
  hash: string
): Promise<TorrentFile[]> {
  try {
    if (settings.client !== 'qbittorrent') {
      logger.warn('File listing only supported for qBittorrent', {
        label: 'Downloads API',
      });
      return [];
    }

    const client = (await getClient(settings)) as QBittorrent;
    const files = await client.torrentFiles(hash);

    // Map and add index
    return files.map((file, index) => ({
      ...file,
      index,
    }));
  } catch (e) {
    logger.error('Failed to get torrent files', {
      label: 'Downloads API',
      client: settings.name,
      error: e.message,
    });
    return [];
  }
}

/**
 * Update torrent metadata (category, save path)
 */
export async function updateTorrentMetadata(
  settings: DownloadClientSettings,
  options: UpdateTorrentRequest
): Promise<boolean> {
  try {
    if (settings.client !== 'qbittorrent') {
      logger.warn('Torrent metadata update only supported for qBittorrent', {
        label: 'Downloads API',
      });
      return false;
    }

    const client = (await getClient(settings)) as QBittorrent;

    if (options.category !== undefined) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).setTorrentCategory(
          [options.hash],
          options.category
        );
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // 409 Conflict means category doesn't exist - try to create it
        if (errorMsg.includes('409')) {
          logger.info('Category does not exist, creating it', {
            label: 'Downloads API',
            client: settings.name,
            category: options.category,
          });
          // Create the category with default save path
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).createCategory(options.category, '');
          // Retry setting the category
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).setTorrentCategory(
            [options.hash],
            options.category
          );
        } else {
          throw error;
        }
      }
    }

    if (options.savePath !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).setTorrentLocation(
        [options.hash],
        options.savePath
      );
    }

    return true;
  } catch (e) {
    logger.error('Failed to update torrent metadata', {
      label: 'Downloads API',
      client: settings.name,
      error: e.message,
    });
    return false;
  }
}

/**
 * Set file priority for torrent files
 */
export async function setTorrentFilePriority(
  settings: DownloadClientSettings,
  options: SetFilePriorityRequest
): Promise<boolean> {
  try {
    if (settings.client !== 'qbittorrent') {
      logger.warn('File priority setting only supported for qBittorrent', {
        label: 'Downloads API',
      });
      return false;
    }

    const client = (await getClient(settings)) as QBittorrent;

    // Pass fileIds as array - normalizeHashes will handle conversion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).setFilePriority(
      options.hash,
      options.fileIds.map(String),
      options.priority
    );

    return true;
  } catch (e) {
    logger.error('Failed to set file priority', {
      label: 'Downloads API',
      client: settings.name,
      error: e.message,
    });
    return false;
  }
}
