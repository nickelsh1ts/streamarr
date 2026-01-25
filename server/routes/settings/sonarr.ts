import SonarrAPI from '@server/api/servarr/sonarr';
import type { SonarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { validateBaseUrl } from '@server/lib/validation/baseUrl';
import logger from '@server/logger';
import { Router } from 'express';

const sonarrRoutes = Router();

sonarrRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.sonarr);
});

sonarrRoutes.post('/', (req, res, next) => {
  const settings = getSettings();

  const newSonarr = req.body as SonarrSettings;
  const lastItem = settings.sonarr[settings.sonarr.length - 1];
  newSonarr.id = lastItem ? lastItem.id + 1 : 0;

  // Validate baseUrl
  const validation = validateBaseUrl(newSonarr.baseUrl, 'sonarr');
  if (!validation.valid) {
    return next({ status: 400, message: validation.error });
  }

  // If we are setting this as the default, clear any previous defaults for the same type first
  // ex: if is4k is true, it will only remove defaults for other servers that have is4k set to true
  // and are the default
  if (req.body.isDefault) {
    settings.sonarr
      .filter((sonarrInstance) => sonarrInstance.is4k === req.body.is4k)
      .forEach((sonarrInstance) => {
        sonarrInstance.isDefault = false;
      });
  }

  settings.sonarr = [...settings.sonarr, newSonarr];
  settings.save();

  res.status(201).json(newSonarr);
});

sonarrRoutes.post('/test', async (req, res, next) => {
  try {
    const sonarr = new SonarrAPI({
      apiKey: req.body.apiKey,
      url: SonarrAPI.buildUrl(req.body, '/api/v3'),
    });

    const urlBase = await sonarr
      .getSystemStatus()
      .then((value) => value.urlBase)
      .catch(() => req.body.baseUrl);
    const profiles = await sonarr.getProfiles();
    const folders = await sonarr.getRootFolders();
    const languageProfiles = await sonarr.getLanguageProfiles();
    const tags = await sonarr.getTags();

    res.status(200).json({
      profiles,
      rootFolders: folders.map((folder) => ({
        id: folder.id,
        path: folder.path,
      })),
      languageProfiles,
      tags,
      urlBase,
    });
  } catch (e) {
    logger.error('Failed to test Sonarr', {
      label: 'Sonarr',
      message: e.message,
    });

    next({ status: 500, message: 'Failed to connect to Sonarr' });
  }
});

sonarrRoutes.put<{ id: string }>('/:id', (req, res, next) => {
  const settings = getSettings();

  const sonarrIndex = settings.sonarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (sonarrIndex === -1) {
    return next({ status: 404, message: 'Settings instance not found' });
  }

  // Validate baseUrl
  const validation = validateBaseUrl(
    req.body.baseUrl,
    'sonarr',
    Number(req.params.id)
  );
  if (!validation.valid) {
    return next({ status: 400, message: validation.error });
  }

  // If we are setting this as the default, clear any previous defaults for the same type first
  // ex: if is4k is true, it will only remove defaults for other servers that have is4k set to true
  // and are the default
  if (req.body.isDefault) {
    settings.sonarr
      .filter((sonarrInstance) => sonarrInstance.is4k === req.body.is4k)
      .forEach((sonarrInstance) => {
        sonarrInstance.isDefault = false;
      });
  }

  settings.sonarr[sonarrIndex] = {
    ...req.body,
    id: Number(req.params.id),
  } as SonarrSettings;
  settings.save();

  res.status(200).json(settings.sonarr[sonarrIndex]);
});

sonarrRoutes.delete<{ id: string }>('/:id', (req, res) => {
  const settings = getSettings();

  const sonarrIndex = settings.sonarr.findIndex(
    (r) => r.id === Number(req.params.id)
  );

  if (sonarrIndex === -1) {
    res
      .status(404)
      .json({ status: '404', message: 'Settings instance not found' });
  }

  const removed = settings.sonarr.splice(sonarrIndex, 1);
  settings.save();

  res.status(200).json(removed[0]);
});

sonarrRoutes.get<{ id: string }>('/:id/auth', async (req, res, next) => {
  const settings = getSettings();
  const sonarrSettings = settings.sonarr.find(
    (s) => s.id === Number(req.params.id)
  );

  if (!sonarrSettings) {
    return next({ status: 404, message: 'Sonarr instance not found' });
  }

  try {
    const sonarr = new SonarrAPI({
      apiKey: sonarrSettings.apiKey,
      url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
    });

    const hostConfig = await sonarr.getHostConfig();

    res.status(200).json({
      authenticationMethod: hostConfig.authenticationMethod,
      isAuthDisabled:
        hostConfig.authenticationMethod === 'External' ||
        hostConfig.authenticationMethod === 'None',
    });
  } catch (e) {
    logger.error('Failed to get Sonarr auth status', {
      label: 'Sonarr',
      message: e.message,
    });
    next({ status: 500, message: 'Failed to connect to Sonarr' });
  }
});

sonarrRoutes.post<{ id: string }>('/:id/auth', async (req, res, next) => {
  const settings = getSettings();
  const sonarrSettings = settings.sonarr.find(
    (s) => s.id === Number(req.params.id)
  );

  if (!sonarrSettings) {
    return next({ status: 404, message: 'Sonarr instance not found' });
  }

  try {
    const sonarr = new SonarrAPI({
      apiKey: sonarrSettings.apiKey,
      url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
    });

    const hostConfig = await sonarr.disableAuthentication();

    logger.info(
      `Authentication disabled on Sonarr instance ${sonarrSettings.name}`,
      {
        label: 'Sonarr',
        userId: req.user?.id,
        instanceId: sonarrSettings.id,
      }
    );

    res.status(200).json({
      success: true,
      authenticationMethod: hostConfig.authenticationMethod,
    });
  } catch (e) {
    logger.error('Failed to disable Sonarr authentication', {
      label: 'Sonarr',
      message: e.message,
    });
    next({
      status: 500,
      message: 'Failed to disable authentication on Sonarr',
    });
  }
});

export default sonarrRoutes;
