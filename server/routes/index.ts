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
import type { User } from '@server/entity/User';
import { isPerson } from '@server/utils/typeHelpers';
import inviteRoutes from './invite';

export const createTmdbWithRegionLanguage = (user?: User): TheMovieDb => {
  const settings = getSettings();

  const region =
    user?.settings?.region === 'all'
      ? ''
      : user?.settings?.region
        ? user?.settings?.region
        : settings.main.region;

  const originalLanguage =
    user?.settings?.originalLanguage === 'all'
      ? ''
      : user?.settings?.originalLanguage
        ? user?.settings?.originalLanguage
        : settings.main.originalLanguage;

  return new TheMovieDb({ region, originalLanguage });
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
router.use('/settings', isAuthenticated(Permission.ADMIN), settingsRoutes);
router.use('/invite', isAuthenticated(), inviteRoutes);
// router.use('/service', isAuthenticated(), serviceRoutes);
router.use('/auth', authRoutes);

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

export default router;
