import type { PlexLibraryItem, PlexMetadata } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import RadarrAPI from '@server/api/servarr/radarr';
import SonarrAPI from '@server/api/servarr/sonarr';
import TautulliAPI from '@server/api/tautulli';
import TheMovieDb from '@server/api/themoviedb';
import type {
  NewsletterBlockConfig,
  RecentlyAddedTypeConfig,
} from '@server/entity/Newsletter';
import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import type { Library } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

export type NewsletterMediaType =
  | 'movie'
  | 'show'
  | 'artist'
  | 'photo'
  | 'other';

export interface NewsletterMediaItem {
  title: string;
  year?: number;
  mediaType: NewsletterMediaType;
  posterPath?: string;
  subtitle?: string;
  /** Plex ratingKey, used to deep-link into the app's /watch player. */
  ratingKey?: string;
}

export interface NewsletterRecentlyAddedSection {
  type: NewsletterMediaType;
  items: NewsletterMediaItem[];
}

export interface NewsletterBlockData {
  recentlyAdded: NewsletterRecentlyAddedSection[];
  topStreams: NewsletterRecentlyAddedSection[];
  byTag: NewsletterMediaItem[];
}

const MAX_BLOCK_ITEMS = 24;
const DEFAULT_DAYS = 7;
const DEFAULT_COUNT = 6;
const DEFAULT_TOP_COUNT = 5;
const DEFAULT_BYTAG_COUNT = 12;
const POSTER_CONCURRENCY = 6;

/**
 * Maps over items with a bounded number of concurrent workers, preserving input
 * order in the result.
 */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index], index);
      }
    }
  );

  await Promise.all(runners);
  return results;
};

// Library types that can contribute a "recently added" section, in the order
// their sections should appear in the email.
export const RECENTLY_ADDED_TYPES: NewsletterMediaType[] = [
  'movie',
  'show',
  'artist',
  'photo',
  'other',
];

export const TOP_STREAMS_TYPES: NewsletterMediaType[] = [
  'movie',
  'show',
  'artist',
];

const TOP_STREAMS_STAT_ID: Partial<Record<NewsletterMediaType, string>> = {
  movie: 'top_movies',
  show: 'top_tv',
  artist: 'top_music',
};

const tmdb = new TheMovieDb();

const getPlexClient = async (): Promise<PlexAPI | null> => {
  const plexToken = await getAdminPlexToken();

  if (!plexToken) {
    return null;
  }

  return new PlexAPI({ plexToken });
};

const normalizeLibraryType = (type: Library['type']): NewsletterMediaType => {
  if (type === 'movie' || type === 'show' || type === 'artist') {
    return type;
  }

  if (type === 'photo') {
    return 'photo';
  }

  return 'other';
};

const getTmdbId = (
  item: PlexLibraryItem | PlexMetadata
): number | undefined => {
  const guid = item.Guid?.find((externalGuid) =>
    externalGuid.id.startsWith('tmdb://')
  );

  if (!guid) {
    return undefined;
  }

  const tmdbId = Number(guid.id.replace('tmdb://', ''));
  return Number.isNaN(tmdbId) ? undefined : tmdbId;
};

const resolvePosterPath = async (
  mediaType: NewsletterMediaType,
  tmdbId?: number
): Promise<string | undefined> => {
  // Only movies and shows have TMDB poster mappings; music/photo/other rely
  // on the placeholder rendered by the email renderer.
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'show')) {
    return undefined;
  }

  try {
    if (mediaType === 'movie') {
      return (await tmdb.getMovie({ movieId: tmdbId })).poster_path;
    }

    return (await tmdb.getTvShow({ tvId: tmdbId })).poster_path;
  } catch {
    return undefined;
  }
};

const collectRecentlyAddedForType = async (
  plexClient: PlexAPI,
  type: NewsletterMediaType,
  config: RecentlyAddedTypeConfig
): Promise<NewsletterMediaItem[]> => {
  const settings = getSettings();
  const days = config.days ?? DEFAULT_DAYS;
  const count = Math.min(config.count ?? DEFAULT_COUNT, MAX_BLOCK_ITEMS);
  const addedAt = Date.now() - days * 24 * 60 * 60 * 1000;

  const libraries = settings.plex.libraries.filter(
    (library) =>
      library.enabled &&
      normalizeLibraryType(library.type) === type &&
      (!config.libraries?.length || config.libraries.includes(library.id))
  );

  type Candidate = {
    item: NewsletterMediaItem;
    showRatingKey?: string;
    plexItem?: PlexLibraryItem;
  };
  const candidates: Candidate[] = [];

  for (const library of libraries) {
    if (candidates.length >= count) {
      break;
    }

    const added =
      (await plexClient.getRecentlyAdded(library.id, { addedAt }, type)) ?? [];

    if (type === 'show') {
      // Show libraries return episodes; group them into their parent shows.
      const shows = new Map<
        string,
        { title: string; ratingKey?: string; episodeCount: number }
      >();

      for (const episode of added) {
        const key =
          episode.grandparentRatingKey ?? episode.grandparentTitle ?? '';

        if (!key) {
          continue;
        }

        const existing = shows.get(key);

        if (existing) {
          existing.episodeCount += 1;
        } else {
          shows.set(key, {
            title: episode.grandparentTitle ?? episode.title,
            ratingKey: episode.grandparentRatingKey,
            episodeCount: 1,
          });
        }
      }

      for (const show of [...shows.values()]) {
        if (candidates.length >= count) {
          break;
        }

        candidates.push({
          item: {
            title: show.title,
            mediaType: 'show',
            ratingKey: show.ratingKey,
            subtitle: `${show.episodeCount} new episode${
              show.episodeCount === 1 ? '' : 's'
            }`,
          },
          showRatingKey: show.ratingKey,
        });
      }
    } else {
      for (const item of added) {
        if (candidates.length >= count) {
          break;
        }

        candidates.push({
          item: {
            title: item.title,
            year: item.year,
            mediaType: type,
            ratingKey: item.ratingKey,
            // Music albums expose the artist as parentTitle.
            subtitle: type === 'artist' ? item.parentTitle : undefined,
          },
          plexItem: item,
        });
      }
    }
  }

  const items = await mapWithConcurrency(
    candidates,
    POSTER_CONCURRENCY,
    async ({ item, showRatingKey, plexItem }) => {
      let posterPath: string | undefined;

      if (item.mediaType === 'show') {
        if (showRatingKey) {
          try {
            const metadata = await plexClient.getMetadata(showRatingKey);
            posterPath = await resolvePosterPath('show', getTmdbId(metadata));
          } catch {
            posterPath = undefined;
          }
        }
      } else if (plexItem) {
        posterPath = await resolvePosterPath(type, getTmdbId(plexItem));
      }

      return { ...item, posterPath };
    }
  );

  return items.slice(0, count);
};

const getRecentlyAdded = async (
  config: NonNullable<NewsletterBlockConfig['recentlyAdded']>
): Promise<NewsletterRecentlyAddedSection[]> => {
  try {
    const plexClient = await getPlexClient();

    if (!plexClient) {
      return [];
    }

    const sections: NewsletterRecentlyAddedSection[] = [];

    for (const type of RECENTLY_ADDED_TYPES) {
      const typeConfig = config[type];

      if (!typeConfig?.enabled) {
        continue;
      }

      try {
        const items = await collectRecentlyAddedForType(
          plexClient,
          type,
          typeConfig
        );

        if (items.length) {
          sections.push({ type, items });
        }
      } catch (e) {
        logger.warn(
          'Failed to gather a recently added section for newsletter',
          {
            label: 'Newsletters',
            mediaType: type,
            errorMessage: e instanceof Error ? e.message : String(e),
          }
        );
      }
    }

    return sections;
  } catch (e) {
    logger.warn('Failed to gather recently added items for newsletter', {
      label: 'Newsletters',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
};

const collectTopStreamsForType = async (
  tautulli: TautulliAPI,
  plexClient: PlexAPI | null,
  type: NewsletterMediaType,
  config: RecentlyAddedTypeConfig
): Promise<NewsletterMediaItem[]> => {
  const statId = TOP_STREAMS_STAT_ID[type];

  if (!statId) {
    return [];
  }

  const days = config.days ?? DEFAULT_DAYS;
  const count = Math.min(config.count ?? DEFAULT_TOP_COUNT, MAX_BLOCK_ITEMS);

  const selectedLibraries = config.libraries;

  // Tautulli's get_home_stats does not accept a section_id parameter, so we
  // cannot scope the request itself. Instead pull the (global) stat once and
  // filter its rows by section_id when specific libraries are selected. Fetch
  // extra rows so there are enough left to satisfy `count` after filtering.
  const fetchCount = selectedLibraries?.length
    ? Math.min(count * 4, 100)
    : count;
  const stats = await tautulli.getHomeStats(days, fetchCount);
  const rows = (
    stats.find((stat) => stat.stat_id === statId)?.rows ?? []
  ).filter(
    (row) =>
      !selectedLibraries?.length ||
      (row.section_id != null &&
        selectedLibraries.includes(String(row.section_id)))
  );

  const candidates: { item: NewsletterMediaItem; ratingKey?: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (candidates.length >= count) {
      break;
    }

    const ratingKey = row.grandparent_rating_key ?? row.rating_key;
    const key = ratingKey != null ? String(ratingKey) : row.title;

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    candidates.push({
      item: {
        title: row.title,
        year: row.year,
        mediaType: type,
        ratingKey: ratingKey != null ? String(ratingKey) : undefined,
        subtitle: `${row.total_plays} play${row.total_plays === 1 ? '' : 's'}`,
      },
      ratingKey: ratingKey != null ? String(ratingKey) : undefined,
    });
  }

  return mapWithConcurrency(
    candidates,
    POSTER_CONCURRENCY,
    async ({ item, ratingKey }) => {
      let posterPath: string | undefined;

      if (plexClient && ratingKey) {
        try {
          const metadata = await plexClient.getMetadata(ratingKey);
          posterPath = await resolvePosterPath(type, getTmdbId(metadata));
        } catch {
          posterPath = undefined;
        }
      }

      return { ...item, posterPath };
    }
  );
};

const getTopStreams = async (
  config: NonNullable<NewsletterBlockConfig['topStreams']>
): Promise<NewsletterRecentlyAddedSection[]> => {
  try {
    const settings = getSettings();

    if (!settings.tautulli.hostname || !settings.tautulli.apiKey) {
      logger.warn(
        'Tautulli is not configured; skipping top streams newsletter block',
        { label: 'Newsletters' }
      );
      return [];
    }

    const tautulli = new TautulliAPI(settings.tautulli);
    const plexClient = await getPlexClient();

    const sections: NewsletterRecentlyAddedSection[] = [];

    for (const type of TOP_STREAMS_TYPES) {
      const typeConfig = config[type];

      if (!typeConfig?.enabled) {
        continue;
      }

      try {
        const items = await collectTopStreamsForType(
          tautulli,
          plexClient,
          type,
          typeConfig
        );

        if (items.length) {
          sections.push({ type, items });
        }
      } catch (e) {
        logger.warn('Failed to gather a top streams section for newsletter', {
          label: 'Newsletters',
          mediaType: type,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return sections;
  } catch (e) {
    logger.warn('Failed to gather top streams for newsletter', {
      label: 'Newsletters',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
};

const getByTag = async (
  config: NonNullable<NewsletterBlockConfig['byTag']>
): Promise<NewsletterMediaItem[]> => {
  const items: NewsletterMediaItem[] = [];
  const seen = new Set<string>();

  const pushUnique = (item: NewsletterMediaItem) => {
    const key = `${item.mediaType}:${item.title.toLowerCase()}:${
      item.year ?? ''
    }`;

    if (!seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
  };

  const settings = getSettings();
  const count = Math.min(config.count ?? DEFAULT_BYTAG_COUNT, MAX_BLOCK_ITEMS);
  const plexLabel = config.plex?.enabled
    ? config.plex.label?.trim()
    : undefined;

  if (plexLabel) {
    try {
      const plexClient = await getPlexClient();

      if (plexClient) {
        const selectedLibraries = config.plex?.libraries;
        const libraries = settings.plex.libraries.filter(
          (library) =>
            library.enabled &&
            (library.type === 'movie' || library.type === 'show') &&
            (!selectedLibraries?.length ||
              selectedLibraries.includes(library.id))
        );

        for (const library of libraries) {
          const labeled = await plexClient.getLabeledItems(
            library.id,
            plexLabel
          );
          const mediaType: NewsletterMediaType =
            library.type === 'show' ? 'show' : 'movie';

          const resolved = await mapWithConcurrency(
            labeled.slice(0, count),
            POSTER_CONCURRENCY,
            async (item) => ({
              title: item.title,
              year: item.year,
              mediaType,
              posterPath: await resolvePosterPath(mediaType, getTmdbId(item)),
              ratingKey: item.ratingKey,
            })
          );

          resolved.forEach(pushUnique);
        }
      }
    } catch (e) {
      logger.warn(
        'Failed to gather Plex labeled items for by tag newsletter block',
        {
          label: 'Newsletters',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
    }
  }

  const radarrTag = config.servarr?.enabled
    ? config.servarr.radarrTag?.trim()
    : undefined;

  if (radarrTag) {
    for (const radarrSettings of settings.radarr) {
      try {
        const radarr = new RadarrAPI({
          apiKey: radarrSettings.apiKey,
          url: RadarrAPI.buildUrl(radarrSettings, '/api/v3'),
          timeout: settings.network.requestTimeout,
        });
        const tags = await radarr.getTags();
        const tag = tags.find(
          (radarrTagEntry) =>
            radarrTagEntry.label.toLowerCase() === radarrTag.toLowerCase()
        );

        if (!tag) {
          continue;
        }

        const movies = (await radarr.getMovies()).filter((movie) =>
          movie.tags.includes(tag.id)
        );

        const resolved = await mapWithConcurrency(
          movies.slice(0, count),
          POSTER_CONCURRENCY,
          async (movie) => ({
            title: movie.title,
            year: movie.year,
            mediaType: 'movie' as const,
            posterPath: await resolvePosterPath('movie', movie.tmdbId),
          })
        );

        resolved.forEach(pushUnique);
      } catch (e) {
        logger.warn(
          'Failed to gather Radarr tagged movies for by tag newsletter block',
          {
            label: 'Newsletters',
            server: radarrSettings.name,
            errorMessage: e instanceof Error ? e.message : String(e),
          }
        );
      }
    }
  }

  const sonarrTag = config.servarr?.enabled
    ? config.servarr.sonarrTag?.trim()
    : undefined;

  if (sonarrTag) {
    for (const sonarrSettings of settings.sonarr) {
      try {
        const sonarr = new SonarrAPI({
          apiKey: sonarrSettings.apiKey,
          url: SonarrAPI.buildUrl(sonarrSettings, '/api/v3'),
          timeout: settings.network.requestTimeout,
        });
        const tags = await sonarr.getTags();
        const tag = tags.find(
          (sonarrTagEntry) =>
            sonarrTagEntry.label.toLowerCase() === sonarrTag.toLowerCase()
        );

        if (!tag) {
          continue;
        }

        const series = (await sonarr.getSeries()).filter((show) =>
          show.tags.includes(tag.id)
        );

        const resolved = await mapWithConcurrency(
          series.slice(0, count),
          POSTER_CONCURRENCY,
          async (show) => {
            let posterPath: string | undefined;

            try {
              const tmdbShow = await tmdb.getShowByTvdbId({
                tvdbId: show.tvdbId,
              });
              posterPath = tmdbShow.poster_path;
            } catch {
              posterPath = undefined;
            }

            return {
              title: show.title,
              year: show.year,
              mediaType: 'show' as const,
              posterPath,
            };
          }
        );

        resolved.forEach(pushUnique);
      } catch (e) {
        logger.warn(
          'Failed to gather Sonarr tagged series for by tag newsletter block',
          {
            label: 'Newsletters',
            server: sonarrSettings.name,
            errorMessage: e instanceof Error ? e.message : String(e),
          }
        );
      }
    }
  }

  return items.slice(0, count);
};

export const resolveBlockData = async (
  blocks: NewsletterBlockConfig | null | undefined
): Promise<NewsletterBlockData> => {
  const hasRecentlyAdded = RECENTLY_ADDED_TYPES.some(
    (type) => blocks?.recentlyAdded?.[type]?.enabled
  );
  const hasTopStreams = TOP_STREAMS_TYPES.some(
    (type) => blocks?.topStreams?.[type]?.enabled
  );

  const [recentlyAdded, topStreams, byTag] = await Promise.all([
    hasRecentlyAdded && blocks?.recentlyAdded
      ? getRecentlyAdded(blocks.recentlyAdded)
      : Promise.resolve([] as NewsletterRecentlyAddedSection[]),
    hasTopStreams && blocks?.topStreams
      ? getTopStreams(blocks.topStreams)
      : Promise.resolve([] as NewsletterRecentlyAddedSection[]),
    blocks?.byTag?.plex?.enabled || blocks?.byTag?.servarr?.enabled
      ? getByTag(blocks.byTag)
      : Promise.resolve([] as NewsletterMediaItem[]),
  ]);

  return { recentlyAdded, topStreams, byTag };
};
