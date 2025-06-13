import type { PlexDevice } from '@server/interfaces/api/plexInterfaces';
import cacheManager from '@server/lib/cache';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { randomUUID } from 'node:crypto';
import xml2js from 'xml2js';
import ExternalAPI from './externalapi';

interface PlexAccountResponse {
  user: PlexUser;
}

interface PlexUser {
  id: number;
  uuid: string;
  email: string;
  joined_at: string;
  username: string;
  title: string;
  thumb: string;
  hasPassword: boolean;
  authToken: string;
  subscription: {
    active: boolean;
    status: string;
    plan: string;
    features: string[];
  };
  roles: { roles: string[] };
  entitlements: string[];
}

interface ConnectionResponse {
  $: {
    protocol: string;
    address: string;
    port: string;
    uri: string;
    local: string;
  };
}

interface DeviceResponse {
  $: {
    name: string;
    product: string;
    productVersion: string;
    platform: string;
    platformVersion: string;
    device: string;
    clientIdentifier: string;
    createdAt: string;
    lastSeenAt: string;
    provides: string;
    owned: string;
    accessToken?: string;
    publicAddress?: string;
    httpsRequired?: string;
    synced?: string;
    relay?: string;
    dnsRebindingProtection?: string;
    natLoopbackSupported?: string;
    publicAddressMatches?: string;
    presence?: string;
    ownerID?: string;
    home?: string;
    sourceTitle?: string;
  };
  Connection: ConnectionResponse[];
}

interface ServerResponse {
  $: {
    id: string;
    serverId: string;
    machineIdentifier: string;
    name: string;
    lastSeenAt: string;
    numLibraries: string;
    owned: string;
  };
}

interface UsersResponse {
  MediaContainer: {
    User: {
      $: {
        id: string;
        title: string;
        username: string;
        email: string;
        thumb: string;
      };
      Server: ServerResponse[];
    }[];
  };
}

interface WatchlistResponse {
  MediaContainer: { totalSize: number; Metadata?: { ratingKey: string }[] };
}

export interface PlexWatchlistItem {
  ratingKey: string;
  tmdbId: number;
  tvdbId?: number;
  type: 'movie' | 'show';
  title: string;
}

export interface PlexWatchlistCache {
  etag: string;
  response: WatchlistResponse;
}

class PlexTvAPI extends ExternalAPI {
  private authToken: string;

  constructor(authToken: string) {
    super(
      'https://plex.tv',
      {},
      {
        headers: {
          'X-Plex-Token': authToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        nodeCache: cacheManager.getCache('plextv').data,
      }
    );
    this.authToken = authToken;
  }

  public async getDevices(): Promise<PlexDevice[]> {
    try {
      const devicesResp = await this.axios.get(
        '/api/resources?includeHttps=1',
        { transformResponse: [], responseType: 'text' }
      );
      // Use explicit xml2js options for better performance and security
      const parsedXml = await xml2js.parseStringPromise(
        devicesResp.data as string,
        { explicitArray: false, ignoreAttrs: false }
      );
      return parsedXml?.MediaContainer?.Device?.map((pxml: DeviceResponse) => ({
        name: pxml.$.name,
        product: pxml.$.product,
        productVersion: pxml.$.productVersion,
        platform: pxml.$?.platform,
        platformVersion: pxml.$?.platformVersion,
        device: pxml.$?.device,
        clientIdentifier: pxml.$.clientIdentifier,
        createdAt: new Date(parseInt(pxml.$?.createdAt, 10) * 1000),
        lastSeenAt: new Date(parseInt(pxml.$?.lastSeenAt, 10) * 1000),
        provides: pxml.$.provides.split(','),
        owned: pxml.$.owned == '1',
        accessToken: pxml.$?.accessToken,
        publicAddress: pxml.$?.publicAddress,
        publicAddressMatches: pxml.$?.publicAddressMatches == '1',
        httpsRequired: pxml.$?.httpsRequired == '1',
        synced: pxml.$?.synced == '1',
        relay: pxml.$?.relay == '1',
        dnsRebindingProtection: pxml.$?.dnsRebindingProtection == '1',
        natLoopbackSupported: pxml.$?.natLoopbackSupported == '1',
        presence: pxml.$?.presence == '1',
        ownerID: pxml.$?.ownerID,
        home: pxml.$?.home == '1',
        sourceTitle: pxml.$?.sourceTitle,
        connection: Array.isArray(pxml?.Connection)
          ? pxml.Connection.map((conn: ConnectionResponse) => ({
              protocol: conn.$.protocol,
              address: conn.$.address,
              port: parseInt(conn.$.port, 10),
              uri: conn.$.uri,
              local: conn.$.local == '1',
            }))
          : [],
      }));
    } catch (e) {
      logger.error('Something went wrong getting the devices from plex.tv', {
        label: 'Plex.tv API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Invalid auth token');
    }
  }

  public async getUser(): Promise<PlexUser> {
    try {
      const account = await this.axios.get<PlexAccountResponse>(
        '/users/account.json'
      );
      return account.data.user;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the account from plex.tv: ${e instanceof Error ? e.message : String(e)}`,
        { label: 'Plex.tv API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async checkUserAccess(userId: number): Promise<boolean> {
    const settings = getSettings();
    try {
      if (!settings.plex.machineId) {
        throw new Error('Plex is not configured!');
      }
      const usersResponse = await this.getUsers();
      const users = usersResponse.MediaContainer.User;
      const user = users.find((u) => parseInt(u.$.id) === userId);
      if (!user) {
        throw new Error(
          "This user does not exist on the main Plex account's shared list"
        );
      }
      return !!user.Server?.find(
        (server) => server.$.machineIdentifier === settings.plex.machineId
      );
    } catch (e) {
      logger.error(`Error checking user access: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }

  public async getUsers(): Promise<UsersResponse> {
    const response = await this.axios.get('/api/users', {
      transformResponse: [],
      responseType: 'text',
    });
    const parsedXml = (await xml2js.parseStringPromise(
      response.data,
      { explicitArray: false, ignoreAttrs: false }
    )) as UsersResponse;
    return parsedXml;
  }

  public async pingToken() {
    try {
      const response = await this.axios.get('/api/v2/ping', {
        headers: { 'X-Plex-Client-Identifier': randomUUID() },
      });
      if (!response?.data?.pong) {
        throw new Error('No pong response');
      }
    } catch (e) {
      logger.error('Failed to ping token', {
        label: 'Plex Refresh Token',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

export default PlexTvAPI;
