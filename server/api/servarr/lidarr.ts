import type { ServiceSettings } from '@server/lib/settings';
import ServarrBase from './base';

class LidarrAPI extends ServarrBase<Record<string, never>> {
  constructor({ url, apiKey }: { url: string; apiKey: string }) {
    super({ url, apiKey, cacheName: 'lidarr', apiName: 'Lidarr' });
  }

  static buildServiceUrl(settings: ServiceSettings, path?: string): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    return `${protocol}://${settings.hostname}:${settings.port}${settings.urlBase ?? ''}${path ?? ''}`;
  }
}

export default LidarrAPI;
