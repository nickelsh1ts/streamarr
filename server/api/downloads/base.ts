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
  last_activity?: number; // Unix timestamp of last activity
  tracker_msg?: string; // Tracker message (can contain error info)
  [key: string]: unknown;
}

// Deluge raw torrent response fields
interface DelugeRawTorrent {
  state: string; // 'Downloading', 'Seeding', 'Paused', 'Checking', 'Queued', 'Error', 'Moving'
  label: string;
  queue: number; // 0-indexed queue position
  upload_payload_rate: number;
  download_payload_rate: number;
  progress: number; // 0-100
  eta: number;
  ratio: number;
  total_size: number;
  save_path: string;
  [key: string]: unknown;
}

// Transmission raw torrent response fields
interface TransmissionRawTorrent {
  status: number; // 0=stopped, 1=check-wait, 2=checking, 3=download-wait, 4=downloading, 5=seed-wait, 6=seeding
  queuePosition: number;
  error: number;
  errorString: string;
  labels: string[];
  percentDone: number;
  eta: number;
  uploadRatio: number;
  rateUpload: number;
  rateDownload: number;
  totalSize: number;
  downloadDir: string;
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

    // For Deluge, enrich error torrents with message field
    if (settings.client === 'deluge' && data.torrents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delugeClient = client as any;
      for (const torrent of data.torrents) {
        if (torrent.raw?.state === 'Error') {
          try {
            const statusData = await delugeClient.request(
              'core.get_torrent_status',
              [torrent.id, ['message']]
            );
            const message = statusData?._data?.result?.message;
            if (message) {
              torrent.raw.message = message;
            }
          } catch {
            // Silently fail - will fall back to generic error message
          }
        }
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
  clientType: 'qbittorrent' | 'deluge' | 'transmission',
  rawData: QBittorrentRawTorrent | DelugeRawTorrent | TransmissionRawTorrent
): NormalizedDownloadItem['status'] {
  // qBittorrent: Use raw state string for better accuracy
  if (clientType === 'qbittorrent') {
    const rawState = (rawData as QBittorrentRawTorrent).state;
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

  // Deluge: Use string state (matches @ctrl/shared-torrent TorrentState enum)
  if (clientType === 'deluge') {
    const delugeState = (rawData as DelugeRawTorrent).state.toLowerCase();
    const delugeStateMap: Record<string, NormalizedDownloadItem['status']> = {
      downloading: 'downloading',
      seeding: 'seeding',
      paused: 'paused',
      checking: 'checking',
      queued: 'queued',
      error: 'error',
      moving: 'moving',
      allocating: 'downloading',
    };
    const mapped = delugeStateMap[delugeState];
    if (mapped) return mapped;
  }

  // Transmission: Use numeric status code
  if (clientType === 'transmission') {
    const transmissionData = rawData as TransmissionRawTorrent;
    const status = transmissionData.status;

    // Check for errors first - if error field is non-zero, it's an error
    // Error codes: 0=no error, 1=tracker warning, 2=tracker error, 3=local error
    if (transmissionData.error && transmissionData.error > 0) {
      return 'error';
    }

    // Status codes: 0=stopped, 1=check-wait, 2=checking, 3=download-wait, 4=downloading, 5=seed-wait, 6=seeding
    const statusMap: Record<number, NormalizedDownloadItem['status']> = {
      0: 'paused',
      1: 'queued',
      2: 'checking',
      3: 'queued',
      4: 'downloading',
      5: 'queued',
      6: 'seeding',
    };
    const mapped = statusMap[status];
    if (mapped) return mapped;
  }

  // Fallback to normalized state mapping from @ctrl/shared-torrent
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
  // Extract raw data based on client type for proper type casting
  let rawData:
    | QBittorrentRawTorrent
    | DelugeRawTorrent
    | TransmissionRawTorrent;

  if (clientSettings.client === 'qbittorrent') {
    rawData = (torrent.raw || {}) as QBittorrentRawTorrent;
  } else if (clientSettings.client === 'deluge') {
    rawData = (torrent.raw || {}) as DelugeRawTorrent;
  } else {
    rawData = (torrent.raw || {}) as TransmissionRawTorrent;
  }

  const status = mapTorrentState(torrent.state, clientSettings.client, rawData);

  // Calculate ETA, handling seeding time for qBittorrent
  let etaValue = torrent.eta;
  let lastSeenCompleteValue: string | undefined = undefined;

  // Capture last seen complete for qBittorrent (all statuses)
  if (clientSettings.client === 'qbittorrent') {
    const raw = rawData as QBittorrentRawTorrent;
    if (raw.seen_complete && raw.seen_complete > 0) {
      lastSeenCompleteValue = new Date(raw.seen_complete * 1000).toISOString();
    }
  }

  // For qBittorrent seeding torrents, calculate ETA based on share limits
  if (
    clientSettings.client === 'qbittorrent' &&
    (status === 'seeding' || status === 'completed')
  ) {
    const raw = rawData as QBittorrentRawTorrent;

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

  // Extract priority/queue position based on client
  let priorityValue: number | undefined = undefined;
  let errorMessage: string | undefined = undefined;

  if (clientSettings.client === 'qbittorrent') {
    const raw = rawData as QBittorrentRawTorrent;
    priorityValue = raw.priority;
    if (queueingEnabled === false) {
      priorityValue = -1;
    }
    if (status === 'error') {
      errorMessage = (raw.tracker_msg as string) || `State: ${raw.state}`;
    }
  } else if (clientSettings.client === 'deluge') {
    priorityValue = torrent.queuePosition;
    const raw = rawData as DelugeRawTorrent;
    if (status === 'error') {
      errorMessage =
        (raw.message as string) ||
        (raw.tracker_status as string) ||
        `State: ${raw.state}`;
    }
  } else if (clientSettings.client === 'transmission') {
    priorityValue = torrent.queuePosition;
    const raw = rawData as TransmissionRawTorrent;
    if (raw.error > 0 && raw.errorString) {
      errorMessage = raw.errorString;
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
    priority: priorityValue,
    errorMessage: errorMessage,
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
        // All three clients support force recheck
        if (settings.client === 'qbittorrent') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).recheckTorrent(hash);
        } else if (settings.client === 'deluge') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).verifyTorrent(hash);
        } else if (settings.client === 'transmission') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).verifyTorrent(hash);
        }
        break;
      case 'queueUp':
      case 'queueDown':
      case 'topPriority':
      case 'bottomPriority':
        // All three clients support queue management
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyClient = client as any;

        try {
          if (settings.client === 'qbittorrent') {
            switch (action) {
              case 'queueUp':
                await anyClient.queueUp(hash);
                break;
              case 'queueDown':
                await anyClient.queueDown(hash);
                break;
              case 'topPriority':
                await anyClient.topPriority(hash);
                break;
              case 'bottomPriority':
                await anyClient.bottomPriority(hash);
                break;
            }
          } else if (settings.client === 'deluge') {
            // Deluge uses different method names
            switch (action) {
              case 'queueUp':
                await anyClient.queueUp(hash);
                break;
              case 'queueDown':
                await anyClient.queueDown(hash);
                break;
              case 'topPriority':
                await anyClient.queueTop(hash);
                break;
              case 'bottomPriority':
                await anyClient.queueBottom(hash);
                break;
            }
          } else if (settings.client === 'transmission') {
            switch (action) {
              case 'queueUp':
                await anyClient.queueUp(hash);
                break;
              case 'queueDown':
                await anyClient.queueDown(hash);
                break;
              case 'topPriority':
                await anyClient.queueTop(hash);
                break;
              case 'bottomPriority':
                await anyClient.queueBottom(hash);
                break;
            }
          }
        } catch (e) {
          const errorMsg = e.message;
          // 409 Conflict for qBittorrent means torrent is already at desired position or ATM is enabled
          if (settings.client === 'qbittorrent' && errorMsg.includes('409')) {
            // Silently ignore 409 conflicts for qBittorrent
            break;
          }
          throw e;
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
 * Manage categories/labels (qBittorrent categories, Deluge/Transmission labels)
 */
export async function manageCategory(
  settings: DownloadClientSettings,
  options: CategoryManagementRequest
): Promise<boolean> {
  try {
    const client = await getClient(settings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient = client as any;

    if (settings.client === 'qbittorrent') {
      // qBittorrent uses categories with save paths
      switch (options.action) {
        case 'create':
          await anyClient.createCategory(options.category, options.savePath);
          break;
        case 'edit':
          await anyClient.editCategory(options.category, options.savePath);
          break;
        case 'delete':
          await anyClient.removeCategory([options.category]);
          break;
        default:
          return false;
      }
    } else if (settings.client === 'deluge') {
      // Deluge uses labels (no save path support, no edit support)
      switch (options.action) {
        case 'create':
          await anyClient.addLabel(options.category);
          break;
        case 'edit':
          logger.warn('Deluge does not support editing labels', {
            label: 'Downloads API',
          });
          return false;
        case 'delete':
          await anyClient.removeLabel(options.category);
          break;
        default:
          return false;
      }
    } else if (settings.client === 'transmission') {
      // Transmission doesn't support categories/labels via API
      logger.warn('Transmission does not support category/label management', {
        label: 'Downloads API',
      });
      return false;
    }

    return true;
  } catch (e) {
    logger.error(`Failed to ${options.action} category/label`, {
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
    const client = await getClient(settings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient = client as any;

    if (settings.client === 'qbittorrent') {
      const files = await anyClient.torrentFiles(hash);
      // Map and add index
      return files.map((file: TorrentFile, index: number) => ({
        ...file,
        index,
      }));
    } else if (settings.client === 'deluge') {
      // Deluge returns Record<string, TorrentContentFile>
      const filesResponse = await anyClient.getTorrentFiles(hash);
      const filesData = filesResponse.result?.contents || {};

      // Convert Record to array and add index with proper typing
      // Deluge priorities from API: 0=skip, 1=low, 2-4=normal, 5-7=high/highest
      // Normalize to UI values: 0=skip, 1=low, 2=normal, 5=high
      return Object.entries(filesData).map(([path, fileData], index) => {
        const file = fileData as {
          size?: number;
          progress?: number;
          priority?: number;
        };
        // Normalize Deluge priority to UI values
        let priority = file.priority ?? 2;
        if (priority === 0) {
          priority = 0; // Skip
        } else if (priority === 1) {
          priority = 1; // Low
        } else if (priority >= 2 && priority <= 4) {
          priority = 2; // Normal
        } else if (priority >= 5) {
          priority = 5; // High
        }
        return {
          name: path,
          size: file.size || 0,
          // Deluge progress is already 0-1 (not 0-100 like torrent progress)
          progress: file.progress || 0,
          priority: priority,
          is_seed: false, // Not provided by Deluge
          piece_range: [0, 0] as [number, number],
          availability: 1, // Not provided by Deluge
          index,
        };
      });
    } else if (settings.client === 'transmission') {
      // Transmission requires fetching torrent with files and fileStats fields
      // Use listTorrents instead of getTorrent because getTorrent doesn't accept additionalFields
      const torrentData = await anyClient.listTorrents(
        [hash],
        ['files', 'fileStats']
      );
      const torrent = torrentData.arguments?.torrents?.[0];

      if (!torrent || !torrent.files || !torrent.fileStats) {
        return [];
      }

      // Combine files and fileStats arrays
      // Transmission priorities: -1=low, 0=normal, 1=high, wanted=true/false for skip
      // Map to UI values: 0=skip, 1=low, 2=normal, 6=high
      return torrent.files.map(
        (file: { name: string; length: number }, index: number) => {
          const stats = torrent.fileStats[index] || {
            bytesCompleted: 0,
            priority: 0,
            wanted: true,
          };
          // Map Transmission priority to UI values
          let normalizedPriority = 2; // Default to normal
          if (!stats.wanted) {
            normalizedPriority = 0; // Don't download (unwanted)
          } else if (stats.priority === -1) {
            normalizedPriority = 1; // Low
          } else if (stats.priority === 0) {
            normalizedPriority = 2; // Normal
          } else if (stats.priority === 1) {
            normalizedPriority = 6; // High
          }
          return {
            name: file.name,
            size: file.length,
            progress: file.length > 0 ? stats.bytesCompleted / file.length : 0,
            priority: normalizedPriority,
            is_seed: false, // Not provided by Transmission
            piece_range: [0, 0] as [number, number],
            availability: 1, // Not provided by Transmission
            index,
          };
        }
      );
    }

    return [];
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
 * Update torrent metadata (category/label, save path)
 */
export async function updateTorrentMetadata(
  settings: DownloadClientSettings,
  options: UpdateTorrentRequest
): Promise<boolean> {
  try {
    const client = await getClient(settings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient = client as any;

    if (settings.client === 'qbittorrent') {
      // qBittorrent supports both category and save path changes
      if (options.category !== undefined) {
        try {
          await anyClient.setTorrentCategory([options.hash], options.category);
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          // 409 Conflict means category doesn't exist - try to create it
          if (errorMsg.includes('409')) {
            logger.info('Category does not exist, creating it', {
              label: 'Downloads API',
              client: settings.name,
              category: options.category,
            });
            // Create the category with default save path
            await anyClient.createCategory(options.category, '');
            // Retry setting the category
            await anyClient.setTorrentCategory(
              [options.hash],
              options.category
            );
          } else {
            throw error;
          }
        }
      }

      if (options.savePath !== undefined) {
        await anyClient.setTorrentLocation([options.hash], options.savePath);
      }
    } else if (settings.client === 'deluge') {
      // Deluge supports labels and move location via setTorrentOptions
      if (options.category !== undefined) {
        try {
          await anyClient.setTorrentLabel(options.hash, options.category);
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          // If label doesn't exist, create it and retry
          if (errorMsg.includes('not exist') || errorMsg.includes('invalid')) {
            logger.info('Label does not exist, creating it', {
              label: 'Downloads API',
              client: settings.name,
              category: options.category,
            });
            await anyClient.addLabel(options.category);
            await anyClient.setTorrentLabel(options.hash, options.category);
          } else {
            throw error;
          }
        }
      }

      if (options.savePath !== undefined) {
        // Deluge uses core.move_storage RPC method to immediately move torrent data
        await anyClient.request('core.move_storage', [
          [options.hash],
          options.savePath,
        ]);
      }
    } else if (settings.client === 'transmission') {
      // Transmission supports labels and move location
      if (options.category !== undefined) {
        // Transmission uses labels array in setTorrent
        await anyClient.setTorrent([options.hash], {
          labels: [options.category],
        });
      }

      if (options.savePath !== undefined) {
        // Transmission uses moveTorrent with move=true to physically move the data
        // The moveTorrent method calls torrent-set-location RPC
        await anyClient.moveTorrent(options.hash, options.savePath, true);
      }
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
    const client = await getClient(settings);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyClient = client as any;

    if (settings.client === 'qbittorrent') {
      // qBittorrent: priority 0=skip, 1=normal, 6=high, 7=maximal
      // Pass fileIds as array - normalizeHashes will handle conversion
      await anyClient.setFilePriority(
        options.hash,
        options.fileIds.map(String),
        options.priority
      );
    } else if (settings.client === 'deluge') {
      // Deluge: Get current file priorities, update specific indexes, set all
      // Deluge priorities when setting: 0=skip, 1=low, 4=normal (middle of 2-4 range), 7=high
      // UI sends: 0, 1, 2, 5 which we need to map to actual Deluge values
      const filesResponse = await anyClient.getTorrentFiles(options.hash);
      const filesData = filesResponse.result?.contents || {};
      const fileCount = Object.keys(filesData).length;

      // Build array of priorities (initialize with current or default to 4=normal)
      const filePriorities = new Array(fileCount).fill(4);
      Object.values(filesData).forEach((file, index) => {
        filePriorities[index] = (file as { priority?: number }).priority || 4;
      });

      // Map UI priority values to actual Deluge API values
      // Deluge API accepts: 0=skip, 1=low, 2-4=normal, 5=high, 7=highest
      const mapUiToDelugePriority = (uiPriority: number): number => {
        switch (uiPriority) {
          case 0:
            return 0; // Skip
          case 1:
            return 1; // Low
          case 2:
            return 4; // Normal (use 4, higher end of normal range for better consistency)
          case 5:
            return 5; // High
          default:
            return 4; // Default to normal
        }
      };

      logger.debug('Setting Deluge file priorities', {
        label: 'Downloads API',
        hash: options.hash,
        fileIds: options.fileIds,
        uiPriority: options.priority,
        delugePriority: mapUiToDelugePriority(options.priority),
      });

      // Update priorities for specified files
      options.fileIds.forEach((fileId) => {
        if (fileId < fileCount) {
          filePriorities[fileId] = mapUiToDelugePriority(options.priority);
        }
      });

      // Set all file priorities at once
      await anyClient.setTorrentOptions(options.hash, {
        file_priorities: filePriorities,
      });

      logger.info('Successfully set Deluge file priorities', {
        label: 'Downloads API',
        hash: options.hash,
        fileCount,
      });
    } else if (settings.client === 'transmission') {
      // Transmission: Uses separate arrays for each priority level
      // Transmission API: -1=low, 0=normal, 1=high, plus wanted/unwanted for skip
      // UI values: 0=skip, 1=low, 2=normal, 6=high
      const priorityMap: Record<string, number[]> = {
        'priority-high': [],
        'priority-normal': [],
        'priority-low': [],
      };
      const filesWanted: number[] = [];
      const filesUnwanted: number[] = [];

      // Map UI priority to Transmission priority levels
      options.fileIds.forEach((fileId) => {
        if (options.priority === 0) {
          // Skip - set as unwanted
          filesUnwanted.push(fileId);
        } else {
          // All other priorities are wanted
          filesWanted.push(fileId);
          if (options.priority === 1) {
            // Low
            priorityMap['priority-low'].push(fileId);
          } else if (options.priority === 2) {
            // Normal
            priorityMap['priority-normal'].push(fileId);
          } else if (options.priority === 6) {
            // High
            priorityMap['priority-high'].push(fileId);
          }
        }
      });

      // Build options object with non-empty arrays
      const transmissionOptions: Record<string, number[]> = {};
      if (filesWanted.length > 0) {
        transmissionOptions['files-wanted'] = filesWanted;
      }
      if (filesUnwanted.length > 0) {
        transmissionOptions['files-unwanted'] = filesUnwanted;
      }
      Object.entries(priorityMap).forEach(([key, ids]) => {
        if (ids.length > 0) {
          transmissionOptions[key] = ids;
        }
      });

      if (Object.keys(transmissionOptions).length > 0) {
        await anyClient.setTorrent([options.hash], transmissionOptions);
      }
    }

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
