import type {
  ShelfmarkGlobalRequestSettings,
  ShelfmarkPolicyMode,
  ShelfmarkSettings,
} from '@server/lib/settings';
import ExternalAPI from './externalapi';

export interface ShelfmarkUser {
  id: number;
  username: string;
  email?: string | null;
}

export interface ShelfmarkAuthStatus {
  authenticated: boolean;
}

export interface ShelfmarkGlobalRequestSettingsResponse {
  values: Required<ShelfmarkGlobalRequestSettings>;
  locked: (keyof ShelfmarkGlobalRequestSettings)[];
}

interface ShelfmarkConfig {
  build_version?: string;
  release_version?: string;
}

interface ShelfmarkUserPolicySettings {
  REQUEST_POLICY_DEFAULT_EBOOK?: ShelfmarkPolicyMode;
  REQUEST_POLICY_DEFAULT_AUDIOBOOK?: ShelfmarkPolicyMode;
}

interface ShelfmarkUserUpdate extends Record<string, unknown> {
  email: string;
  display_name: string;
  settings?: ShelfmarkUserPolicySettings;
}

class ShelfmarkAPI extends ExternalAPI {
  static buildUrl(settings: ShelfmarkSettings): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    return `${protocol}://${settings.hostname}:${settings.port}${settings.urlBase}`;
  }

  public async getHealth(): Promise<void> {
    try {
      await this.get('/api/health');
    } catch (e) {
      throw new Error(
        `[Shelfmark] Failed to retrieve health: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getVersion(): Promise<string> {
    try {
      const config = await this.get<ShelfmarkConfig>('/api/config');
      return config.release_version || config.build_version || 'Unknown';
    } catch (e) {
      throw new Error(
        `[Shelfmark] Failed to retrieve version: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getAuthStatus(): Promise<ShelfmarkAuthStatus> {
    try {
      return await this.get<ShelfmarkAuthStatus>('/api/auth/check');
    } catch (e) {
      throw new Error(
        `[Shelfmark] Failed to check authentication status: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getAllUsers(): Promise<ShelfmarkUser[]> {
    try {
      return await this.get<ShelfmarkUser[]>('/api/admin/users');
    } catch (e) {
      throw new Error(
        `[Shelfmark] Failed to retrieve users: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getGlobalRequestSettings(): Promise<ShelfmarkGlobalRequestSettingsResponse> {
    const tab = await this.get<{
      fields: { key: string; value: unknown; fromEnv?: boolean }[];
    }>('/api/settings/users');
    const requests = tab.fields.find(
      (field) => field.key === 'REQUESTS_ENABLED'
    );
    const limit = tab.fields.find(
      (field) => field.key === 'MAX_PENDING_REQUESTS_PER_USER'
    );
    const notes = tab.fields.find(
      (field) => field.key === 'REQUESTS_ALLOW_NOTES'
    );
    if (
      typeof requests?.value !== 'boolean' ||
      typeof notes?.value !== 'boolean' ||
      typeof limit?.value !== 'number' ||
      !Number.isInteger(limit.value) ||
      limit.value < 1 ||
      limit.value > 1000
    ) {
      throw new Error(
        'Shelfmark returned unsupported global request settings.'
      );
    }
    const locked: (keyof ShelfmarkGlobalRequestSettings)[] = [];
    if (requests.fromEnv) locked.push('requestsEnabled');
    if (limit.fromEnv) locked.push('requestLimit');
    if (notes.fromEnv) locked.push('requestsAllowNotes');

    return {
      values: {
        requestsEnabled: requests.value,
        requestLimit: limit.value,
        requestsAllowNotes: notes.value,
      },
      locked,
    };
  }

  public async updateGlobalRequestSettings(
    values: ShelfmarkGlobalRequestSettings
  ): Promise<void> {
    const current = await this.getGlobalRequestSettings();
    if (
      (values.requestsEnabled !== undefined &&
        current.locked.includes('requestsEnabled')) ||
      (values.requestLimit !== undefined &&
        current.locked.includes('requestLimit')) ||
      (values.requestsAllowNotes !== undefined &&
        current.locked.includes('requestsAllowNotes'))
    ) {
      throw new Error(
        'A selected Shelfmark request setting is managed by an environment variable.'
      );
    }
    const shelfmarkValues = {
      ...(values.requestsEnabled !== undefined && {
        REQUESTS_ENABLED: values.requestsEnabled,
      }),
      ...(values.requestLimit !== undefined && {
        MAX_PENDING_REQUESTS_PER_USER: values.requestLimit,
      }),
      ...(values.requestsAllowNotes !== undefined && {
        REQUESTS_ALLOW_NOTES: values.requestsAllowNotes,
      }),
    };
    const result = await this.put<{
      success: boolean;
      updated: string[];
      message?: string;
    }>('/api/settings/users', shelfmarkValues);
    if (
      !result.success ||
      Object.keys(shelfmarkValues).some((key) => !result.updated?.includes(key))
    ) {
      throw new Error(
        result.message || 'Shelfmark did not apply all global request settings.'
      );
    }
  }

  public async updateUser(
    userId: number,
    userData: ShelfmarkUserUpdate
  ): Promise<ShelfmarkUser> {
    try {
      return await this.put<ShelfmarkUser>(
        `/api/admin/users/${userId}`,
        userData
      );
    } catch (e) {
      throw new Error(
        `[Shelfmark] Failed to update user ${userId}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default ShelfmarkAPI;
