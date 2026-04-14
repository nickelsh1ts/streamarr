import type { ServiceSettings } from '@server/lib/settings';
import type {
  SeerrQuotaResponse,
  SeerrNotificationsResponse,
} from '@server/interfaces/api/seerrInterfaces';
import logger from '@server/logger';
import type { AxiosInstance } from 'axios';
import axios from 'axios';

interface SeerrMainSettings {
  defaultQuotas: {
    movie: {
      quotaLimit: number;
      quotaDays: number;
    };
    tv: {
      quotaLimit: number;
      quotaDays: number;
    };
  };
}

class SeerrAPI {
  private axios: AxiosInstance;

  constructor(settings: ServiceSettings) {
    this.axios = axios.create({
      baseURL: `${settings.useSsl ? 'https' : 'http'}://${settings.hostname}:${
        settings.port
      }/api/v1`,
      headers: {
        'X-Api-Key': settings.apiKey ?? '',
      },
    });
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

      const enabledAgents: string[] = [];
      results.forEach((result, index) => {
        if (
          result.status === 'fulfilled' &&
          result.value.data?.enabled === true
        ) {
          enabledAgents.push(agentNames[index]);
        }
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

  public async getUserQuotaByPlexId(
    plexId: number
  ): Promise<SeerrQuotaResponse> {
    try {
      const response = await this.axios.get<{
        results: {
          id: number;
          plexId: number;
          movieQuotaLimit?: number | null;
          movieQuotaDays?: number | null;
          tvQuotaLimit?: number | null;
          tvQuotaDays?: number | null;
        }[];
      }>('/user');

      const seerrUser = response.data.results?.find((u) => u.plexId === plexId);

      if (!seerrUser) {
        return {
          movieQuotaLimit: null,
          movieQuotaDays: null,
          tvQuotaLimit: null,
          tvQuotaDays: null,
        };
      }

      return {
        movieQuotaLimit: seerrUser.movieQuotaLimit ?? null,
        movieQuotaDays: seerrUser.movieQuotaDays ?? null,
        tvQuotaLimit: seerrUser.tvQuotaLimit ?? null,
        tvQuotaDays: seerrUser.tvQuotaDays ?? null,
      };
    } catch (e) {
      logger.error('Something went wrong fetching Seerr user quota', {
        label: 'Seerr API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error(
        `[Seerr] Failed to fetch user quota: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default SeerrAPI;
