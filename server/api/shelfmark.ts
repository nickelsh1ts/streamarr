import type { ShelfmarkSettings } from '@server/lib/settings';
import ExternalAPI from './externalapi';

export interface ShelfmarkUser {
  id: number;
  username: string;
  email?: string | null;
}

export interface ShelfmarkAuthStatus {
  authenticated: boolean;
}

interface ShelfmarkConfig {
  build_version?: string;
  release_version?: string;
}

interface ShelfmarkUserUpdate extends Record<string, unknown> {
  email: string;
  display_name: string;
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
