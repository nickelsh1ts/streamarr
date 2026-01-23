import type {
  DownloadClientSettings,
  DownloadClientType,
} from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const downloadsRoutes = Router();

const DEFAULT_PORTS: Record<DownloadClientType, number> = {
  qbittorrent: 8080,
  deluge: 8112,
  transmission: 9091,
};

downloadsRoutes.get('/', (_req, res) => {
  const settings = getSettings();
  res.status(200).json(settings.downloads);
});

downloadsRoutes.post('/', (req, res, next) => {
  try {
    const settings = getSettings();
    const newClient = req.body as Partial<DownloadClientSettings>;

    if (!newClient.client) {
      return next({ status: 400, message: 'Client type is required' });
    }

    if (!newClient.hostname) {
      return next({ status: 400, message: 'Hostname is required' });
    }

    if (!newClient.name) {
      return next({ status: 400, message: 'Name is required' });
    }

    // Generate ID
    const lastItem = settings.downloads[settings.downloads.length - 1];
    const newId = lastItem ? lastItem.id + 1 : 0;

    const clientSettings: DownloadClientSettings = {
      id: newId,
      name: newClient.name,
      client: newClient.client,
      hostname: newClient.hostname,
      port: newClient.port ?? DEFAULT_PORTS[newClient.client],
      useSsl: newClient.useSsl ?? false,
      username: newClient.username,
      password: newClient.password,
      externalUrl: newClient.externalUrl,
    };

    settings.downloads = [...settings.downloads, clientSettings];
    settings.save();

    logger.info(`Download client created: ${clientSettings.name}`, {
      label: 'Downloads',
      client: clientSettings.client,
      externalUrl: clientSettings.externalUrl,
    });

    res.status(201).json(clientSettings);
  } catch (error) {
    logger.error('Failed to create download client', {
      label: 'Downloads',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next({ status: 500, message: 'Failed to create download client' });
  }
});

downloadsRoutes.put<{ id: string }>('/:id', (req, res, next) => {
  try {
    const settings = getSettings();
    const clientId = Number(req.params.id);

    const clientIndex = settings.downloads.findIndex((c) => c.id === clientId);

    if (clientIndex === -1) {
      return next({ status: 404, message: 'Download client not found' });
    }

    const existingClient = settings.downloads[clientIndex];
    const updates = req.body as Partial<DownloadClientSettings>;

    const updatedClient: DownloadClientSettings = {
      ...existingClient,
      ...updates,
      id: clientId, // Ensure ID cannot be changed
      externalUrl: updates.externalUrl ?? existingClient.externalUrl,
    };

    settings.downloads[clientIndex] = updatedClient;
    settings.save();

    logger.info(`Download client updated: ${updatedClient.name}`, {
      label: 'Downloads',
      client: updatedClient.client,
    });

    res.status(200).json(updatedClient);
  } catch (error) {
    logger.error('Failed to update download client', {
      label: 'Downloads',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next({ status: 500, message: 'Failed to update download client' });
  }
});

downloadsRoutes.delete<{ id: string }>('/:id', (req, res, next) => {
  try {
    const settings = getSettings();
    const clientId = Number(req.params.id);

    const clientIndex = settings.downloads.findIndex((c) => c.id === clientId);

    if (clientIndex === -1) {
      return next({ status: 404, message: 'Download client not found' });
    }

    const removed = settings.downloads.splice(clientIndex, 1)[0];

    settings.save();

    logger.info(`Download client removed: ${removed.name}`, {
      label: 'Downloads',
      client: removed.client,
    });

    res.status(200).json(removed);
  } catch (error) {
    logger.error('Failed to delete download client', {
      label: 'Downloads',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next({ status: 500, message: 'Failed to delete download client' });
  }
});

export default downloadsRoutes;
