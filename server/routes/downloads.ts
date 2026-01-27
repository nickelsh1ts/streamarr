import { Router } from 'express';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import {
  fetchClientData,
  performTorrentAction,
  addTorrent,
  manageCategory,
  normalizeTorrent,
  getTorrentFiles,
  updateTorrentMetadata,
  setTorrentFilePriority,
} from '@server/api/downloads/base';
import type {
  DownloadsResponse,
  NormalizedDownloadItem,
  DownloadClientStats,
  TorrentActionRequest,
  AddTorrentRequest,
  CategoryManagementRequest,
  UpdateTorrentRequest,
  SetFilePriorityRequest,
} from '@server/interfaces/api/downloadsInterfaces';

const downloadsRoutes = Router();

downloadsRoutes.get('/', async (req, res, next) => {
  try {
    const settings = getSettings();
    const {
      page = '1',
      pageSize = '25',
      sort = 'addedDate',
      sortDirection = 'desc',
      filter = '',
      clientId,
      status,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    if (settings.downloads.length === 0) {
      res.json({
        results: [],
        stats: [],
        pageInfo: {
          pages: 0,
          pageSize: pageSizeNum,
          results: 0,
          page: pageNum,
        },
      } as DownloadsResponse);
      return;
    }

    // Fetch data from all clients in parallel
    const clientDataPromises = settings.downloads.map(
      async (clientSettings) => {
        try {
          const data = await fetchClientData(clientSettings);
          return {
            clientSettings,
            data,
            error: null,
          };
        } catch (e) {
          return {
            clientSettings,
            data: null,
            error: e.message || 'Unknown error',
          };
        }
      }
    );

    const clientResults = await Promise.all(clientDataPromises);

    // Aggregate all torrents and generate stats
    const allTorrents: NormalizedDownloadItem[] = [];
    const stats: DownloadClientStats[] = [];

    for (const result of clientResults) {
      const { clientSettings, data, error } = result;

      if (data && data.torrents) {
        // Normalize and add torrents
        const normalizedTorrents = data.torrents.map((torrent) =>
          normalizeTorrent(torrent, clientSettings, data.queueingEnabled)
        );
        allTorrents.push(...normalizedTorrents);

        // Calculate stats for this client
        const activeTorrents = normalizedTorrents.filter(
          (t) => t.status === 'downloading' || t.status === 'seeding'
        ).length;
        const pausedTorrents = normalizedTorrents.filter(
          (t) => t.status === 'paused'
        ).length;

        stats.push({
          clientId: clientSettings.id,
          clientName: clientSettings.name,
          clientType: clientSettings.client,
          connected: true,
          totalDownloadSpeed: normalizedTorrents.reduce(
            (sum, t) => sum + t.downloadSpeed,
            0
          ),
          totalUploadSpeed: normalizedTorrents.reduce(
            (sum, t) => sum + t.uploadSpeed,
            0
          ),
          activeTorrents,
          pausedTorrents,
          totalTorrents: normalizedTorrents.length,
        });
      } else {
        // Client failed to connect
        stats.push({
          clientId: clientSettings.id,
          clientName: clientSettings.name,
          clientType: clientSettings.client,
          connected: false,
          error: error || 'Failed to fetch data',
          totalDownloadSpeed: 0,
          totalUploadSpeed: 0,
          activeTorrents: 0,
          pausedTorrents: 0,
          totalTorrents: 0,
        });
      }
    }

    // Filter by clientId if specified
    let filteredTorrents = allTorrents;
    if (clientId) {
      const clientIdNum = parseInt(clientId as string, 10);
      filteredTorrents = filteredTorrents.filter(
        (t) => t.clientId === clientIdNum
      );
    }

    // Filter by status if specified
    if (status) {
      filteredTorrents = filteredTorrents.filter((t) => t.status === status);
    }

    // Filter by search term if specified
    if (filter && typeof filter === 'string' && filter.trim() !== '') {
      const searchTerm = filter.toLowerCase();
      filteredTorrents = filteredTorrents.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm) ||
          t.category?.toLowerCase().includes(searchTerm) ||
          t.savePath.toLowerCase().includes(searchTerm)
      );
    }

    // Sort torrents
    filteredTorrents.sort((a, b) => {
      let comparison = 0;

      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'eta':
          comparison = a.eta - b.eta;
          break;
        case 'ratio':
          comparison = a.ratio - b.ratio;
          break;
        case 'speed':
          comparison =
            a.downloadSpeed + a.uploadSpeed - (b.downloadSpeed + b.uploadSpeed);
          break;
        case 'priority':
          // Treat priority 0 and undefined/-1 as highest value (sort last in ascending)
          const aPriority =
            a.priority === undefined || a.priority === -1 || a.priority === 0
              ? Infinity
              : a.priority;
          const bPriority =
            b.priority === undefined || b.priority === -1 || b.priority === 0
              ? Infinity
              : b.priority;
          comparison = aPriority - bPriority;
          break;
        case 'addedDate':
        default:
          comparison =
            new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
          break;
      }

      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const totalResults = filteredTorrents.length;
    const totalPages = Math.ceil(totalResults / pageSizeNum);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const paginatedTorrents = filteredTorrents.slice(startIndex, endIndex);

    res.json({
      results: paginatedTorrents,
      stats,
      pageInfo: {
        pages: totalPages,
        pageSize: pageSizeNum,
        results: totalResults,
        page: pageNum,
      },
    } as DownloadsResponse);
  } catch (e) {
    logger.error('Failed to fetch downloads', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to fetch downloads' });
  }
});

downloadsRoutes.post('/:hash/action', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { clientId, action, ...options } = req.body as TorrentActionRequest;

    // Check for undefined/null (not falsy check, since clientId can be 0)
    if (!hash || clientId === undefined || clientId === null || !action) {
      next({
        status: 400,
        message: 'Missing required parameters: hash, clientId, or action',
      });
      return;
    }

    const settings = getSettings();
    const clientSettings = settings.downloads.find((c) => c.id === clientId);

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    const success = await performTorrentAction(
      clientSettings,
      hash,
      action,
      options
    );

    if (!success) {
      next({
        status: 400,
        message: `Failed to ${action} torrent. Action may not be supported for this client.`,
      });
      return;
    }

    res.json({ success: true });
  } catch (e) {
    logger.error('Failed to update torrent', {
      label: 'Downloads',
      action: req.body.action,
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to update torrent' });
  }
});

downloadsRoutes.post('/action', async (req, res, next) => {
  try {
    const { torrents, action, ...options } = req.body as {
      torrents: { hash: string; clientId: number }[];
      action: string;
      deleteFiles?: boolean;
    };

    if (!torrents || !Array.isArray(torrents) || torrents.length === 0) {
      next({
        status: 400,
        message: 'torrents array is required and must not be empty',
      });
      return;
    }

    if (!action) {
      next({
        status: 400,
        message: 'action is required',
      });
      return;
    }

    const settings = getSettings();
    const results: {
      hash: string;
      clientId: number;
      success: boolean;
      error?: string;
    }[] = [];

    // Process each torrent
    for (const torrent of torrents) {
      try {
        const clientSettings = settings.downloads.find(
          (c) => c.id === torrent.clientId
        );

        if (!clientSettings) {
          results.push({
            hash: torrent.hash,
            clientId: torrent.clientId,
            success: false,
            error: 'Download client not found',
          });
          continue;
        }

        const success = await performTorrentAction(
          clientSettings,
          torrent.hash,
          action,
          options
        );

        results.push({
          hash: torrent.hash,
          clientId: torrent.clientId,
          success,
          error: success ? undefined : `Failed to ${action} torrent`,
        });
      } catch (e) {
        results.push({
          hash: torrent.hash,
          clientId: torrent.clientId,
          success: false,
          error: e.message || String(e),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: failureCount === 0,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
    });
  } catch (e) {
    logger.error('Failed to update torrents', {
      label: 'Downloads',
      torrents: req.body.torrents,
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to update torrents' });
  }
});

downloadsRoutes.post('/add', async (req, res, next) => {
  try {
    const addRequest = req.body as AddTorrentRequest;

    if (addRequest.clientId === undefined || addRequest.clientId === null) {
      next({ status: 400, message: 'clientId is required' });
      return;
    }

    if (!addRequest.torrent && !addRequest.file) {
      next({
        status: 400,
        message: 'Either torrent URL/magnet or file must be provided',
      });
      return;
    }

    const settings = getSettings();
    const clientSettings = settings.downloads.find(
      (c) => c.id === addRequest.clientId
    );

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    await addTorrent(clientSettings, addRequest);

    res.json({ success: true, clientId: addRequest.clientId });
  } catch (e) {
    logger.error('Failed to add torrent', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({
      status: 500,
      message: !e.message.includes('Failed to add torrent')
        ? e.message
        : 'Failed to add torrent. Check that the magnet link or file is valid.',
    });
  }
});

downloadsRoutes.post('/category', async (req, res, next) => {
  try {
    const categoryRequest = req.body as CategoryManagementRequest;

    if (
      !categoryRequest.clientId ||
      !categoryRequest.action ||
      !categoryRequest.category
    ) {
      next({
        status: 400,
        message: 'clientId, action, and category are required',
      });
      return;
    }

    const settings = getSettings();
    const clientSettings = settings.downloads.find(
      (c) => c.id === categoryRequest.clientId
    );

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    const success = await manageCategory(clientSettings, categoryRequest);

    res.json({ success });
  } catch (e) {
    logger.error('Failed to update category', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to update category' });
  }
});

downloadsRoutes.get('/:hash/files', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { clientId } = req.query;

    if (clientId === undefined || clientId === null) {
      next({ status: 400, message: 'clientId is required' });
      return;
    }

    const clientIdNum = parseInt(clientId as string, 10);
    const settings = getSettings();
    const clientSettings = settings.downloads.find((c) => c.id === clientIdNum);

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    const files = await getTorrentFiles(clientSettings, hash);

    res.json({ files });
  } catch (e) {
    logger.error('Failed to get torrent files', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to get torrent files' });
  }
});

downloadsRoutes.patch('/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const updateRequest = req.body as UpdateTorrentRequest;

    if (
      updateRequest.clientId === undefined ||
      updateRequest.clientId === null
    ) {
      next({ status: 400, message: 'clientId is required' });
      return;
    }

    const settings = getSettings();
    const clientSettings = settings.downloads.find(
      (c) => c.id === updateRequest.clientId
    );

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    const success = await updateTorrentMetadata(clientSettings, {
      ...updateRequest,
      hash,
    });

    if (!success) {
      next({ status: 400, message: 'Failed to update torrent' });
      return;
    }

    res.json({ success: true });
  } catch (e) {
    logger.error('Failed to update torrent', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to update torrent' });
  }
});

downloadsRoutes.post('/:hash/files/priority', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const priorityRequest = req.body as SetFilePriorityRequest;

    if (
      priorityRequest.clientId === undefined ||
      priorityRequest.clientId === null
    ) {
      next({ status: 400, message: 'clientId is required' });
      return;
    }

    if (!priorityRequest.fileIds || priorityRequest.fileIds.length === 0) {
      next({ status: 400, message: 'fileIds are required' });
      return;
    }

    if (priorityRequest.priority === undefined) {
      next({ status: 400, message: 'priority is required' });
      return;
    }

    const settings = getSettings();
    const clientSettings = settings.downloads.find(
      (c) => c.id === priorityRequest.clientId
    );

    if (!clientSettings) {
      next({ status: 404, message: 'Download client not found' });
      return;
    }

    const success = await setTorrentFilePriority(clientSettings, {
      ...priorityRequest,
      hash,
    });

    if (!success) {
      next({ status: 400, message: 'Failed to set file priority' });
      return;
    }

    res.json({ success: true });
  } catch (e) {
    logger.error('Failed to set file priority', {
      label: 'Downloads',
      error: e.message || String(e),
    });
    next({ status: 500, message: 'Failed to set file priority' });
  }
});

export default downloadsRoutes;
