import type { ServiceSettings } from '@server/lib/settings';
import ServarrBase from './base';

class ProwlarrAPI extends ServarrBase<Record<string, never>> {
  constructor({
    url,
    apiKey,
    timeout,
  }: {
    url: string;
    apiKey: string;
    timeout?: number;
  }) {
    super({ url, apiKey, cacheName: 'prowlarr', apiName: 'Prowlarr', timeout });
  }

  static buildServiceUrl(settings: ServiceSettings, path?: string): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    return `${protocol}://${settings.hostname}:${settings.port}${settings.urlBase ?? ''}${path ?? ''}`;
  }
}

export default ProwlarrAPI;
