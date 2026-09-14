import type { CalibreWebSettings } from '@server/lib/settings';
import ExternalAPI from './externalapi';

export type CalibreWebConnection = Pick<
  CalibreWebSettings,
  'hostname' | 'port' | 'useSsl'
>;

class CalibreWebAPI extends ExternalAPI {
  static buildUrl(settings: CalibreWebConnection): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    return `${protocol}://${settings.hostname}:${settings.port ?? 8083}`;
  }

  /**
   * Calibre-Web (and its CWA/ACW forks) has no JSON API or health-check
   * endpoint, so this just confirms the server responds to an
   * unauthenticated request for its login page.
   */
  public async testConnection(): Promise<void> {
    try {
      await this.get<string>('/login');
    } catch (e) {
      throw new Error(
        `[Calibre-Web] Failed to connect: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default CalibreWebAPI;
