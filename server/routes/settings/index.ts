import PlexAPI from '@server/api/plexapi';
import PlexTvAPI from '@server/api/plextv';
import TautulliAPI from '@server/api/tautulli';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { PlexConnection } from '@server/interfaces/api/plexInterfaces';
import type {
  LogMessage,
  LogsResultsResponse,
  SettingsAboutResponse,
} from '@server/interfaces/api/settingsInterfaces';
import { scheduledJobs } from '@server/job/schedule';
import type { AvailableCacheIds } from '@server/lib/cache';
import cacheManager from '@server/lib/cache';
import ImageProxy from '@server/lib/imageproxy';
import { Permission } from '@server/lib/permissions';
import { plexFullScanner } from '@server/lib/scanners/plex';
import type {
  JobId,
  MainSettings,
  ServiceSettings,
} from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { appDataPath } from '@server/utils/appDataVolume';
import { getAppVersion } from '@server/utils/appVersion';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import QRCodeProxy from '@server/lib/qrcodeproxy';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { escapeRegExp, merge, omit, set, sortBy } from 'lodash';
import { rescheduleJob } from 'node-schedule';
import semver from 'semver';
import { URL } from 'url';
import notificationRoutes from './notifications';
import Invite from '@server/entity/Invite';
import radarrRoutes from './radarr';
import sonarrRoutes from './sonarr';
import logoSettingsRoutes from './logos';

const settingsRoutes = Router();

settingsRoutes.use('/notifications', notificationRoutes);
settingsRoutes.use('/radarr', radarrRoutes);
settingsRoutes.use('/sonarr', sonarrRoutes);
settingsRoutes.use('/logos', logoSettingsRoutes);

const filteredMainSettings = (
  user: User,
  main: MainSettings
): Partial<MainSettings> => {
  if (!user?.hasPermission(Permission.ADMIN)) {
    return omit(main, 'apiKey');
  }

  return main;
};

settingsRoutes.get('/main', (req, res, next) => {
  const settings = getSettings();

  if (!req.user) {
    return next({ status: 400, message: 'User missing from request.' });
  }

  res.status(200).json(filteredMainSettings(req.user, settings.main));
});

settingsRoutes.post('/main', (req, res, next) => {
  try {
    const settings = getSettings();

    // Filter out file objects and other non-serializable data
    const filteredBody = omit(req.body, ['customLogo', 'customLogoSmall']);

    settings.main = merge(settings.main, filteredBody);
    settings.save();

    res.status(200).json(settings.main);
  } catch (error) {
    logger.error('Error saving main settings:', error);
    next({ status: 500, message: 'Failed to save settings' });
  }
});

settingsRoutes.post('/main/regenerate', (req, res, next) => {
  const settings = getSettings();

  const main = settings.regenerateApiKey();

  if (!req.user) {
    return next({ status: 500, message: 'User missing from request.' });
  }

  res.status(200).json(filteredMainSettings(req.user, main));
});

settingsRoutes.get('/plex', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.plex);
});

settingsRoutes.post('/plex', async (req, res, next) => {
  const userRepository = getRepository(User);
  const settings = getSettings();
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });

    Object.assign(settings.plex, req.body);

    const plexClient = new PlexAPI({ plexToken: admin.plexToken });

    const result = await plexClient.getStatus();

    if (!result?.MediaContainer?.machineIdentifier) {
      throw new Error('app not found');
    }

    settings.plex.machineId = result.MediaContainer.machineIdentifier;
    settings.plex.name = result.MediaContainer.friendlyName;

    settings.save();
  } catch (e) {
    logger.error('Something went wrong testing Plex connection', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to connect to Plex.' });
  }

  res.status(200).json(settings.plex);
});

settingsRoutes.get('/plex/devices/servers', async (req, res, next) => {
  const userRepository = getRepository(User);
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });
    const plexTvClient = admin.plexToken
      ? new PlexTvAPI(admin.plexToken)
      : null;
    const devices = (await plexTvClient?.getDevices())?.filter((device) => {
      return device.provides.includes('server') && device.owned;
    });
    const settings = getSettings();

    if (devices) {
      await Promise.all(
        devices.map(async (device) => {
          const plexDirectConnections: PlexConnection[] = [];

          device.connection.forEach((connection) => {
            const url = new URL(connection.uri);

            if (url.hostname !== connection.address) {
              const plexDirectConnection = { ...connection };
              plexDirectConnection.address = url.hostname;
              plexDirectConnections.push(plexDirectConnection);

              // Connect to IP addresses over HTTP
              connection.protocol = 'http';
            }
          });

          plexDirectConnections.forEach((plexDirectConnection) => {
            device.connection.push(plexDirectConnection);
          });

          await Promise.all(
            device.connection.map(async (connection) => {
              const plexDeviceSettings = {
                ...settings.plex,
                ip: connection.address,
                port: connection.port,
                useSsl: connection.protocol === 'https',
              };
              const plexClient = new PlexAPI({
                plexToken: admin.plexToken,
                plexSettings: plexDeviceSettings,
                timeout: 5000,
              });

              try {
                await plexClient.getStatus();
                connection.status = 200;
                connection.message = 'OK';
              } catch (e) {
                connection.status = 500;
                connection.message = e.message.split(':')[0];
              }
            })
          );
        })
      );
    }
    res.status(200).json(devices);
  } catch (e) {
    logger.error('Something went wrong retrieving Plex app list', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to retrieve Plex app list.' });
  }
});

settingsRoutes.get('/plex/library', async (req, res) => {
  const settings = getSettings();

  if (req.query.sync) {
    const userRepository = getRepository(User);
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });
    const plexapi = new PlexAPI({ plexToken: admin.plexToken });

    await plexapi.syncLibraries();
  }

  const enabledLibraries = req.query.enable
    ? (req.query.enable as string).split(',')
    : [];
  settings.plex.libraries = settings.plex.libraries.map((library) => ({
    ...library,
    enabled: enabledLibraries.includes(library.id),
  }));
  settings.save();
  res.status(200).json(settings.plex.libraries);
});

settingsRoutes.get('/plex/sync', (_req, res) => {
  res.status(200).json(plexFullScanner.status());
});

settingsRoutes.post('/plex/sync', (req, res) => {
  if (req.body.cancel) {
    plexFullScanner.cancel();
  } else if (req.body.start) {
    plexFullScanner.run();
  }
  res.status(200).json(plexFullScanner.status());
});

settingsRoutes.get('/services', (_req, res) => {
  const settings = getSettings();

  const services: ServiceSettings[] = [];

  services.push(
    settings.bazarr,
    settings.downloads,
    settings.lidarr,
    settings.overseerr,
    settings.prowlarr,
    settings.tdarr,
    settings.uptime
  );

  const servicesWithId = [
    { ...settings.bazarr, id: 'bazarr' },
    { ...settings.downloads, id: 'downloads' },
    { ...settings.lidarr, id: 'lidarr' },
    { ...settings.overseerr, id: 'overseerr' },
    { ...settings.prowlarr, id: 'prowlarr' },
    { ...settings.tdarr, id: 'tdarr' },
    { ...settings.uptime, id: 'uptime' },
  ];

  res.status(200).json(servicesWithId);
});

settingsRoutes.get('/uptime', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.uptime);
});

settingsRoutes.post('/uptime', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.uptime, req.body);
  settings.save();
  res.status(200).json(settings.uptime);
});

settingsRoutes.get('/downloads', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.downloads);
});

settingsRoutes.post('/downloads', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.downloads, req.body);
  settings.save();
  res.status(200).json(settings.downloads);
});

settingsRoutes.get('/tdarr', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.tdarr);
});

settingsRoutes.post('/tdarr', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.tdarr, req.body);
  settings.save();
  res.status(200).json(settings.tdarr);
});

settingsRoutes.get('/bazarr', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.bazarr);
});

settingsRoutes.post('/bazarr', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.bazarr, req.body);
  settings.save();
  res.status(200).json(settings.bazarr);
});

settingsRoutes.get('/prowlarr', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.prowlarr);
});

settingsRoutes.post('/prowlarr', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.prowlarr, req.body);
  settings.save();
  res.status(200).json(settings.prowlarr);
});

settingsRoutes.get('/lidarr', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.lidarr);
});

settingsRoutes.post('/lidarr', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.lidarr, req.body);
  settings.save();
  res.status(200).json(settings.lidarr);
});

settingsRoutes.get('/overseerr', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.overseerr);
});

settingsRoutes.post('/overseerr', async (req, res) => {
  const settings = getSettings();

  Object.assign(settings.overseerr, req.body);
  settings.save();
  res.status(200).json(settings.overseerr);
});

settingsRoutes.get('/tautulli', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.tautulli);
});

settingsRoutes.post('/tautulli', async (req, res, next) => {
  const settings = getSettings();

  Object.assign(settings.tautulli, req.body);

  if (settings.tautulli.hostname) {
    try {
      const tautulliClient = new TautulliAPI(settings.tautulli);

      const result = await tautulliClient.getInfo();

      if (!semver.gte(semver.coerce(result?.tautulli_version) ?? '', '2.9.0')) {
        throw new Error('Tautulli version not supported');
      }

      settings.save();
    } catch (e) {
      logger.error('Something went wrong testing Tautulli connection', {
        label: 'API',
        errorMessage: e.message,
      });
      return next({ status: 500, message: 'Unable to connect to Tautulli.' });
    }
  }

  res.status(200).json(settings.tautulli);
});

settingsRoutes.get(
  '/plex/users',
  isAuthenticated(Permission.MANAGE_USERS),
  async (req, res, next) => {
    const userRepository = getRepository(User);
    const qb = userRepository.createQueryBuilder('user');

    try {
      const admin = await userRepository.findOneOrFail({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });
      const plexApi = new PlexTvAPI(admin.plexToken ?? '');
      const plexUsers = (await plexApi.getUsers()).MediaContainer.User.map(
        (user) => user.$
      ).filter((user) => user.email);

      const unimportedPlexUsers: {
        id: string;
        title: string;
        username: string;
        email: string;
        thumb: string;
      }[] = [];

      const existingUsers = await qb
        .where('user.plexId IN (:...plexIds)', {
          plexIds: plexUsers.map((plexUser) => plexUser.id),
        })
        .orWhere('user.email IN (:...plexEmails)', {
          plexEmails: plexUsers.map((plexUser) => plexUser.email.toLowerCase()),
        })
        .getMany();

      await Promise.all(
        plexUsers.map(async (plexUser) => {
          if (
            !existingUsers.find(
              (user) =>
                user.plexId === parseInt(plexUser.id) ||
                user.email === plexUser.email.toLowerCase()
            ) &&
            (await plexApi.checkUserAccess(parseInt(plexUser.id)))
          ) {
            unimportedPlexUsers.push(plexUser);
          }
        })
      );

      res.status(200).json(sortBy(unimportedPlexUsers, 'username'));
    } catch (e) {
      logger.error('Something went wrong getting unimported Plex users', {
        label: 'API',
        errorMessage: e.message,
      });
      next({
        status: 500,
        message: 'Unable to retrieve unimported Plex users.',
      });
    }
  }
);

settingsRoutes.get(
  '/logs',
  rateLimit({ windowMs: 60 * 1000, max: 50 }),
  (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 25;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const search = (req.query.search as string) ?? '';
    const searchRegexp = new RegExp(escapeRegExp(search), 'i');

    let filter: string[] = [];
    switch (req.query.filter) {
      case 'debug':
        filter.push('debug');
      // falls through
      case 'info':
        filter.push('info');
      // falls through
      case 'warn':
        filter.push('warn');
      // falls through
      case 'error':
        filter.push('error');
        break;
      default:
        filter = ['debug', 'info', 'warn', 'error'];
    }

    const logFile = process.env.CONFIG_DIRECTORY
      ? `${process.env.CONFIG_DIRECTORY}/logs/.machinelogs.json`
      : path.join(__dirname, '../../../config/logs/.machinelogs.json');
    const logs: LogMessage[] = [];
    const logMessageProperties = [
      'timestamp',
      'level',
      'label',
      'message',
      'data',
    ];

    const deepValueStrings = (obj: Record<string, unknown>): string[] => {
      const values = [];

      for (const val of Object.values(obj)) {
        if (typeof val === 'string') {
          values.push(val);
        } else if (typeof val === 'number') {
          values.push(val.toString());
        } else if (val !== null && typeof val === 'object') {
          values.push(...deepValueStrings(val as Record<string, unknown>));
        }
      }

      return values;
    };

    try {
      fs.readFileSync(logFile, 'utf-8')
        .split('\n')
        .forEach((line) => {
          if (!line.length) return;

          const logMessage = JSON.parse(line);

          if (!filter.includes(logMessage.level)) {
            return;
          }

          if (
            !Object.keys(logMessage).every((key) =>
              logMessageProperties.includes(key)
            )
          ) {
            Object.keys(logMessage)
              .filter((prop) => !logMessageProperties.includes(prop))
              .forEach((prop) => {
                set(logMessage, `data.${prop}`, logMessage[prop]);
              });
          }

          if (req.query.search) {
            if (
              // label and data are sometimes undefined
              !searchRegexp.test(logMessage.label ?? '') &&
              !searchRegexp.test(logMessage.message) &&
              !deepValueStrings(logMessage.data ?? {}).some((val) =>
                searchRegexp.test(val)
              )
            ) {
              return;
            }
          }

          logs.push(logMessage);
        });

      const displayedLogs = logs.reverse().slice(skip, skip + pageSize);

      res.status(200).json({
        pageInfo: {
          pages: Math.ceil(logs.length / pageSize),
          pageSize,
          results: logs.length,
          page: Math.ceil(skip / pageSize) + 1,
        },
        results: displayedLogs,
      } as LogsResultsResponse);
    } catch (error) {
      logger.error('Something went wrong while retrieving logs', {
        label: 'Logs',
        errorMessage: error.message,
      });
      return next({ status: 500, message: 'Unable to retrieve logs.' });
    }
  }
);

settingsRoutes.get('/jobs', (_req, res) => {
  res.status(200).json(
    scheduledJobs.map((job) => ({
      id: job.id,
      name: job.name,
      type: job.type,
      interval: job.interval,
      cronSchedule: job.cronSchedule,
      nextExecutionTime: job.job.nextInvocation(),
      running: job.running ? job.running() : false,
    }))
  );
});

settingsRoutes.post<{ jobId: string }>('/jobs/:jobId/run', (req, res, next) => {
  const scheduledJob = scheduledJobs.find((job) => job.id === req.params.jobId);

  if (!scheduledJob) {
    return next({ status: 404, message: 'Job not found.' });
  }

  scheduledJob.job.invoke();

  res.status(200).json({
    id: scheduledJob.id,
    name: scheduledJob.name,
    type: scheduledJob.type,
    interval: scheduledJob.interval,
    cronSchedule: scheduledJob.cronSchedule,
    nextExecutionTime: scheduledJob.job.nextInvocation(),
    running: scheduledJob.running ? scheduledJob.running() : false,
  });
});

settingsRoutes.post<{ jobId: JobId }>(
  '/jobs/:jobId/cancel',
  (req, res, next) => {
    const scheduledJob = scheduledJobs.find(
      (job) => job.id === req.params.jobId
    );

    if (!scheduledJob) {
      return next({ status: 404, message: 'Job not found.' });
    }

    if (scheduledJob.cancelFn) {
      scheduledJob.cancelFn();
    }

    res.status(200).json({
      id: scheduledJob.id,
      name: scheduledJob.name,
      type: scheduledJob.type,
      interval: scheduledJob.interval,
      cronSchedule: scheduledJob.cronSchedule,
      nextExecutionTime: scheduledJob.job.nextInvocation(),
      running: scheduledJob.running ? scheduledJob.running() : false,
    });
  }
);

settingsRoutes.post<{ jobId: JobId }>(
  '/jobs/:jobId/schedule',
  (req, res, next) => {
    const scheduledJob = scheduledJobs.find(
      (job) => job.id === req.params.jobId
    );

    if (!scheduledJob) {
      return next({ status: 404, message: 'Job not found.' });
    }

    const result = rescheduleJob(scheduledJob.job, req.body.schedule);
    const settings = getSettings();

    if (result) {
      settings.jobs[scheduledJob.id].schedule = req.body.schedule;
      settings.save();

      scheduledJob.cronSchedule = req.body.schedule;

      res.status(200).json({
        id: scheduledJob.id,
        name: scheduledJob.name,
        type: scheduledJob.type,
        interval: scheduledJob.interval,
        cronSchedule: scheduledJob.cronSchedule,
        nextExecutionTime: scheduledJob.job.nextInvocation(),
        running: scheduledJob.running ? scheduledJob.running() : false,
      });
    } else {
      return next({ status: 400, message: 'Invalid job schedule.' });
    }
  }
);

settingsRoutes.get('/cache', async (_req, res) => {
  const cacheManagerCaches = cacheManager.getAllCaches();

  const apiCaches = Object.values(cacheManagerCaches).map((cache) => ({
    id: cache.id,
    name: cache.name,
    stats: cache.getStats(),
  }));

  const tmdbImageCache = await ImageProxy.getImageStats('tmdb');

  // QR code cache stats
  const qrProxy = new QRCodeProxy();
  const qrCacheDir = qrProxy.getCacheDirectory();
  let qrImageCount = 0;
  let qrCacheSize = 0;
  try {
    const files = await fsPromises.readdir(qrCacheDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        qrImageCount++;
        const stat = await fsPromises.stat(path.join(qrCacheDir, file));
        qrCacheSize += stat.size;
      }
    }
  } catch {
    // ignore errors, just show 0s
  }

  res.status(200).json({
    apiCaches,
    imageCache: {
      tmdb: tmdbImageCache,
      qrcode: { imageCount: qrImageCount, size: qrCacheSize },
    },
  });
});

settingsRoutes.post<{ cacheId: AvailableCacheIds }>(
  '/cache/:cacheId/flush',
  (req, res, next) => {
    const cache = cacheManager.getCache(req.params.cacheId);

    if (cache) {
      cache.flush();
      res.status(204).send();
    } else {
      next({ status: 404, message: 'Cache not found.' });
    }
  }
);

settingsRoutes.post(
  '/initialize',
  isAuthenticated(Permission.ADMIN),
  (_req, res) => {
    const settings = getSettings();

    settings.public.initialized = true;
    settings.save();

    res.status(200).json(settings.public);
  }
);

settingsRoutes.get('/about', async (req, res) => {
  const inviteRepository = getRepository(Invite);
  const userRepository = getRepository(User);

  const totalInvites = await inviteRepository.count();
  const totalUsers = await userRepository.count();

  res.status(200).json({
    version: getAppVersion(),
    totalInvites,
    totalUsers,
    tz: process.env.TZ,
    appDataPath: appDataPath(),
  } as SettingsAboutResponse);
});

export default settingsRoutes;
