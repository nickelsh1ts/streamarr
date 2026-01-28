import type { PaginatedResponse } from './common';
import type { DownloadClientType } from '@server/lib/settings';

export interface NormalizedDownloadItem {
  id: string;
  hash: string;
  name: string;
  clientId: number;
  clientName: string;
  clientType: DownloadClientType;
  size: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  eta: number;
  status:
    | 'downloading'
    | 'seeding'
    | 'paused'
    | 'queued'
    | 'checking'
    | 'error'
    | 'completed'
    | 'stalled'
    | 'moving'
    | 'metadata';
  ratio: number;
  addedDate: string;
  completedDate?: string;
  lastSeenComplete?: string;
  savePath: string;
  category?: string;
  tags?: string[];
  seeds: number;
  peers: number;
  totalSeeds: number;
  totalPeers: number;
  priority?: number; // Queue position (-1 if queuing disabled)
  errorMessage?: string; // Error message if status is 'error'
}

export interface DownloadClientStats {
  clientId: number;
  clientName: string;
  clientType: DownloadClientType;
  connected: boolean;
  error?: string;
  totalDownloadSpeed: number;
  totalUploadSpeed: number;
  activeTorrents: number;
  pausedTorrents: number;
  totalTorrents: number;
  health?: {
    status: 'healthy' | 'retrying' | 'unhealthy';
    lastError?: string;
    cooldownUntil?: string;
    isStale?: boolean;
  };
}

export interface DownloadsResponse extends PaginatedResponse {
  results: NormalizedDownloadItem[];
  stats: DownloadClientStats[];
}

export interface DownloadResultsResponse extends PaginatedResponse {
  results: NormalizedDownloadItem[];
  stats: DownloadClientStats[];
}

export interface TorrentActionRequest {
  clientId: number;
  action:
    | 'pause'
    | 'resume'
    | 'remove'
    | 'forceRecheck'
    | 'queueUp'
    | 'queueDown'
    | 'topPriority'
    | 'bottomPriority';
  deleteFiles?: boolean;
}

export interface AddTorrentRequest {
  clientId: number;
  torrent?: string;
  file?: string;
  category?: string;
  savePath?: string;
  paused?: boolean;
}

export interface CategoryManagementRequest {
  clientId: number;
  action: 'create' | 'edit' | 'delete';
  category: string;
  savePath?: string;
}

export interface TorrentFile {
  name: string;
  size: number;
  progress: number;
  priority: number;
  is_seed: boolean;
  piece_range: [number, number];
  availability: number;
  index: number;
}

export interface UpdateTorrentRequest {
  hash: string;
  clientId: number;
  category?: string;
  savePath?: string;
}

export interface SetFilePriorityRequest {
  hash: string;
  clientId: number;
  fileIds: number[];
  priority: number;
}
