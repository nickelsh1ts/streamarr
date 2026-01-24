import GithubAPI from '@server/api/github';
import TheMovieDb from '@server/api/themoviedb';
import type {
  TmdbMovieResult,
  TmdbTvResult,
} from '@server/api/themoviedb/interfaces';
import type { StatusResponse } from '@server/interfaces/api/settingsInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import settingsRoutes from './settings';
import { appDataPath, appDataStatus } from '@server/utils/appDataVolume';
import { getAppVersion, getCommitTag } from '@server/utils/appVersion';
import { Router } from 'express';
import authRoutes from './auth';
import user from './user';
import { isPerson } from '@server/utils/typeHelpers';
import inviteRoutes from './invite';
import serviceRoutes from './service';
import calendarRoutes from './calendar';
import PlexAPI from '@server/api/plexapi';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import signupRoutes from './signup';
import notificationRoutes from '@server/routes/notification';

export const createTmdbWithRegionLanguage = (): TheMovieDb => {
  return new TheMovieDb();
};

const router = Router();

router.use(checkUser);

router.get<unknown, StatusResponse>('/status', async (req, res) => {
  const githubApi = new GithubAPI();

  const currentVersion = getAppVersion();
  const commitTag = getCommitTag();
  let updateAvailable = false;
  let commitsBehind = 0;

  if (currentVersion.startsWith('develop-') && commitTag !== 'local') {
    const commits = await githubApi.getStreamarrCommits();

    if (commits.length) {
      const filteredCommits = commits.filter(
        (commit) => !commit.commit.message.includes('[skip ci]')
      );
      if (filteredCommits[0].sha !== commitTag) {
        updateAvailable = true;
      }

      const commitIndex = filteredCommits.findIndex(
        (commit) => commit.sha === commitTag
      );

      if (updateAvailable) {
        commitsBehind = commitIndex;
      }
    }
  } else if (commitTag !== 'local') {
    const releases = await githubApi.getStreamarrReleases();

    if (releases.length) {
      const latestVersion = releases[0];

      if (!latestVersion.name.includes(currentVersion)) {
        updateAvailable = true;
      }
    }
  }

  res.status(200).json({
    version: getAppVersion(),
    commitTag: getCommitTag(),
    updateAvailable,
    commitsBehind,
  });
});

router.get('/status/appdata', (_req, res) => {
  res
    .status(200)
    .json({ appData: appDataStatus(), appDataPath: appDataPath() });
});

router.use('/user', isAuthenticated(), user);
router.get('/settings/public', async (req, res) => {
  const settings = getSettings();

  if (!(req.user?.settings?.notificationTypes.webpush ?? true)) {
    res
      .status(200)
      .json({ ...settings.fullPublicSettings, enablePushRegistration: false });
  } else {
    res.status(200).json(settings.fullPublicSettings);
  }
});

router.get('/libraries', async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });
    const plexApi = new PlexAPI({ plexToken: admin.plexToken });

    const enabledLibraries = settings.plex.libraries
      .filter((lib) => lib.enabled)
      .sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Get media counts for each enabled library
    const results = await Promise.all(
      enabledLibraries.map(async (lib) => {
        const { totalSize } = await plexApi.getLibraryContents(lib.id, {
          size: 0,
        });
        return {
          id: lib.id,
          name: lib.name,
          type: lib.type,
          mediaCount: totalSize,
        };
      })
    );

    res.status(200).json(results);
  } catch (e) {
    logger.error('Something went wrong getting plex libraries', {
      label: 'API',
      errorMessage: e.message,
    });
    next({
      status: 500,
      message: 'Unable to retrieve Plex libraries.',
    });
  }
});

router.get('/libraries/items', isAuthenticated(), async (req, res, next) => {
  const settings = getSettings();
  const userRepository = getRepository(User);
  try {
    const admin = await userRepository.findOneOrFail({
      select: { id: true, plexToken: true },
      where: { id: 1 },
    });

    const isOwner = req.user?.id === 1;
    let enabledLibraries = settings.plex.libraries.filter((lib) => lib.enabled);

    if (!isOwner) {
      const userSharedLibraries = req.user?.settings?.sharedLibraries;

      if (userSharedLibraries === 'all') {
        // User has access to all enabled libraries (no filtering needed)
      } else if (
        !userSharedLibraries ||
        userSharedLibraries === 'server' ||
        userSharedLibraries === ''
      ) {
        const defaultLibs = settings.main.sharedLibraries;

        if (defaultLibs === 'all' || !defaultLibs) {
          // Server default is "All Libraries" (no filtering needed)
        } else {
          const adminConfiguredLibs = defaultLibs
            .split(/[,|]/)
            .map((id) => id.trim())
            .filter((id) => id !== '');

          enabledLibraries = enabledLibraries.filter((lib) =>
            adminConfiguredLibs.includes(lib.id)
          );
        }
      } else if (typeof userSharedLibraries === 'string') {
        const requestedLibs = userSharedLibraries
          .split(/[,|]/)
          .map((id) => id.trim())
          .filter((id) => id !== '');

        enabledLibraries = enabledLibraries.filter((lib) =>
          requestedLibs.includes(lib.id)
        );
      } else {
        res.status(200).json([]);
        return;
      }
    }

    // Handle sorting
    const sortBy = req.query.sort as string;
    if (sortBy === 'id') {
      enabledLibraries = enabledLibraries.sort(
        (a, b) => parseInt(a.id) - parseInt(b.id)
      );
    } else if (sortBy === 'name') {
      enabledLibraries = enabledLibraries.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else if (sortBy === 'type') {
      enabledLibraries = enabledLibraries.sort((a, b) =>
        a.type.localeCompare(b.type)
      );
    }

    const plexApi = new PlexAPI({ plexToken: admin.plexToken });
    const machineId = settings.plex.machineId;

    // Build library links with proper Plex URLs
    const results = await Promise.all(
      enabledLibraries.map(async (lib) => {
        const { totalSize } = await plexApi.getLibraryContents(lib.id, {
          size: 0,
        });

        const plexUrl = `/watch/web/index.html#!/media/${machineId}/com.plexapp.plugins.library?source=${lib.id}`;
        const regExp = `source=${lib.id}&`;

        return {
          id: lib.id,
          name: lib.name,
          type: lib.type,
          mediaCount: totalSize,
          href: plexUrl,
          regExp: regExp,
        };
      })
    );

    res.status(200).json(results);
  } catch (e) {
    logger.error('Something went wrong getting plex library links', {
      label: 'API',
      errorMessage: e.message,
    });
    next({
      status: 500,
      message: 'Unable to retrieve Plex library links.',
    });
  }
});

router.use('/settings', isAuthenticated(Permission.ADMIN), settingsRoutes);
router.use('/invite', isAuthenticated(), inviteRoutes);
router.use(
  '/notification',
  isAuthenticated(
    [Permission.MANAGE_NOTIFICATIONS, Permission.CREATE_NOTIFICATIONS],
    { type: 'or' }
  ),
  notificationRoutes
);
router.use('/service', isAuthenticated(), serviceRoutes);
router.use('/auth', authRoutes);
router.use('/signup', signupRoutes);

router.get('/regions', isAuthenticated(), async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const regions = await tmdb.getRegions();

    res.status(200).json(regions);
  } catch (e) {
    logger.debug('Something went wrong retrieving regions', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to retrieve regions.' });
  }
});

router.get('/languages', isAuthenticated(), async (req, res, next) => {
  const tmdb = new TheMovieDb();

  try {
    const languages = await tmdb.getLanguages();

    res.status(200).json(languages);
  } catch (e) {
    logger.debug('Something went wrong retrieving languages', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to retrieve languages.' });
  }
});

router.get('/backdrops', async (req, res, next) => {
  const tmdb = createTmdbWithRegionLanguage();

  try {
    const data = (
      await tmdb.getAllTrending({ page: 1, timeWindow: 'week' })
    ).results.filter((result) => !isPerson(result)) as (
      | TmdbMovieResult
      | TmdbTvResult
    )[];

    res
      .status(200)
      .json(
        data
          .map((result) => result.backdrop_path)
          .filter((backdropPath) => !!backdropPath)
      );
  } catch (e) {
    logger.debug('Something went wrong retrieving backdrops', {
      label: 'API',
      errorMessage: e.message,
    });
    return next({ status: 500, message: 'Unable to retrieve backdrops.' });
  }
});

router.get('/', (_req, res) => {
  res.status(200).json({ api: 'Streamarr API', version: '1.0' });
});

router.use(
  '/calendar',
  isAuthenticated([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
    type: 'or',
  }),
  calendarRoutes
);

export default router;
