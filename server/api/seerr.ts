import type { ServiceSettings } from '@server/lib/settings';
import type {
  SeerrQuotaResponse,
  SeerrNotificationsResponse,
  SeerrRequestItem,
  SeerrRequestsResponse,
} from '@server/interfaces/api/seerrInterfaces';
import logger from '@server/logger';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

interface SeerrMainSettings {
  defaultQuotas: {
    movie: { quotaLimit: number; quotaDays: number };
    tv: { quotaLimit: number; quotaDays: number };
  };
}

interface RawSeerrUser {
  id: number;
  plexId: number;
  displayName?: string;
  username?: string | null;
  plexUsername?: string | null;
  email?: string;
  avatar?: string | null;
  movieQuotaLimit?: number | null;
  movieQuotaDays?: number | null;
  tvQuotaLimit?: number | null;
  tvQuotaDays?: number | null;
}

interface SeerrUserQuotaDetail {
  days: number | null;
  limit: number | null;
  remaining: number | null;
  restricted: boolean;
}

interface SeerrUserQuota {
  movie: SeerrUserQuotaDetail;
  tv: SeerrUserQuotaDetail;
}

interface RawSeerrRequest {
  id: number;
  status: number;
  type: string;
  media: { tmdbId: number; status: number };
  requestedBy: Pick<
    RawSeerrUser,
    'id' | 'displayName' | 'username' | 'plexUsername' | 'email' | 'avatar'
  >;
  seasons?: { id: number; seasonNumber: number }[];
  createdAt: string;
}

class SeerrAPI {
  private static readonly userListCache = new Map<
    string,
    { users: RawSeerrUser[]; fetchedAt: number }
  >();
  private static readonly USER_CACHE_TTL_MS = 60_000;

  private readonly axios: AxiosInstance;
  private readonly baseURL: string;

  constructor(settings: ServiceSettings) {
    this.baseURL = `${settings.useSsl ? 'https' : 'http'}://${settings.hostname}:${settings.port}/api/v1`;
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: { 'X-Api-Key': settings.apiKey ?? '' },
    });
  }

  private mapRawRequest(r: RawSeerrRequest): SeerrRequestItem {
    return {
      id: r.id,
      type: r.type as 'movie' | 'tv',
      requestStatus: r.status,
      mediaStatus: r.media.status,
      media: { tmdbId: r.media.tmdbId },
      seasons: r.seasons ?? [],
      requestedBy: {
        id: r.requestedBy.id,
        displayName:
          r.requestedBy.displayName ||
          r.requestedBy.username ||
          r.requestedBy.plexUsername ||
          r.requestedBy.email ||
          'Unknown User',
        avatar: r.requestedBy.avatar ?? '',
      },
      createdAt: r.createdAt,
    };
  }

  private async getSeerrUsers(): Promise<RawSeerrUser[]> {
    const cached = SeerrAPI.userListCache.get(this.baseURL);
    if (cached && Date.now() - cached.fetchedAt < SeerrAPI.USER_CACHE_TTL_MS) {
      return cached.users;
    }
    const response = await this.axios.get<{ results: RawSeerrUser[] }>(
      '/user',
      { params: { take: 1000, skip: 0 } }
    );
    const users = response.data.results ?? [];
    SeerrAPI.userListCache.set(this.baseURL, { users, fetchedAt: Date.now() });
    return users;
  }

  private async findSeerrUserByPlexId(
    plexId: number
  ): Promise<RawSeerrUser | null> {
    const users = await this.getSeerrUsers();
    return users.find((u) => u.plexId === plexId) ?? null;
  }

  private async fetchMediaDetails(
    path: string,
    label: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.axios.get<Record<string, unknown>>(path);
      return response.data;
    } catch (e) {
      logger.error(`Something went wrong fetching Seerr ${label}`, {
        label: 'Seerr API',
        path,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error(
        `[Seerr] Failed to fetch ${label}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getDefaultQuotas(): Promise<SeerrQuotaResponse> {
    try {
      const response =
        await this.axios.get<SeerrMainSettings>('/settings/main');
      const quotas = response.data.defaultQuotas;

      return {
        movieQuotaLimit: quotas?.movie?.quotaLimit ?? null,
        movieQuotaDays: quotas?.movie?.quotaDays ?? null,
        tvQuotaLimit: quotas?.tv?.quotaLimit ?? null,
        tvQuotaDays: quotas?.tv?.quotaDays ?? null,
      };
    } catch (e) {
      logger.error('Something went wrong fetching Seerr default quotas', {
        label: 'Seerr API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error(
        `[Seerr] Failed to fetch default quotas: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getEnabledNotificationAgents(): Promise<SeerrNotificationsResponse> {
    const agentNames = [
      'email',
      'discord',
      'slack',
      'telegram',
      'pushover',
      'webpush',
    ];

    try {
      const results = await Promise.allSettled(
        agentNames.map((agent) =>
          this.axios.get<{ enabled: boolean }>(
            `/settings/notifications/${agent}`
          )
        )
      );
      const enabledAgents = agentNames.filter((_, i) => {
        const result = results[i];
        return (
          result.status === 'fulfilled' && result.value.data?.enabled === true
        );
      });

      return { enabledAgents };
    } catch (e) {
      logger.error('Something went wrong fetching Seerr notification agents', {
        label: 'Seerr API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error(
        `[Seerr] Failed to fetch notification agents: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getUserQuotaWithUsageByPlexId(
    plexId: number
  ): Promise<SeerrQuotaResponse> {
    try {
      const seerrUser = await this.findSeerrUserByPlexId(plexId);
      if (!seerrUser) {
        const defaults = await this.getDefaultQuotas();
        return {
          ...defaults,
          movieQuotaRemaining: null,
          tvQuotaRemaining: null,
        };
      }
      const response = await this.axios.get<SeerrUserQuota>(
        `/user/${seerrUser.id}/quota`
      );

      return {
        movieQuotaLimit: response.data.movie.limit || null,
        movieQuotaDays: response.data.movie.days || null,
        movieQuotaRemaining: response.data.movie.remaining ?? null,
        tvQuotaLimit: response.data.tv.limit || null,
        tvQuotaDays: response.data.tv.days || null,
        tvQuotaRemaining: response.data.tv.remaining ?? null,
      };
    } catch (e) {
      logger.error(
        'Something went wrong fetching Seerr user quota with usage',
        {
          label: 'Seerr API',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
      throw new Error(
        `[Seerr] Failed to fetch user quota with usage: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getRequestsByPlexId(
    plexId: number,
    take: number,
    skip: number
  ): Promise<SeerrRequestsResponse> {
    try {
      const seerrUser = await this.findSeerrUserByPlexId(plexId);
      if (!seerrUser) {
        return {
          pageInfo: { pages: 0, pageSize: take, results: 0, page: 1 },
          results: [],
        };
      }
      const response = await this.axios.get<{
        pageInfo: SeerrRequestsResponse['pageInfo'];
        results: RawSeerrRequest[];
      }>('/request', {
        params: { requestedBy: seerrUser.id, take, skip, sort: 'added' },
      });

      return {
        pageInfo: response.data.pageInfo,
        results: response.data.results.map((r) => this.mapRawRequest(r)),
      };
    } catch (e) {
      logger.error('Something went wrong fetching Seerr user requests', {
        label: 'Seerr API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error(
        `[Seerr] Failed to fetch user requests: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getRequestById(
    requestId: number
  ): Promise<SeerrRequestItem | null> {
    try {
      const response = await this.axios.get<RawSeerrRequest>(
        `/request/${requestId}`
      );
      return this.mapRawRequest(response.data);
    } catch (e) {
      logger.error('Something went wrong fetching Seerr request by ID', {
        label: 'Seerr API',
        requestId,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  }

  public getMovieDetails(tmdbId: number): Promise<Record<string, unknown>> {
    return this.fetchMediaDetails(`/movie/${tmdbId}`, 'movie details');
  }

  public getTvDetails(tmdbId: number): Promise<Record<string, unknown>> {
    return this.fetchMediaDetails(`/tv/${tmdbId}`, 'TV details');
  }
}

export default SeerrAPI;
