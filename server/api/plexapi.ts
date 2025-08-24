import type { Library, PlexSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import NodePlexAPI from 'plex-api';

export interface PlexLibraryItem {
  ratingKey: string;
  parentRatingKey?: string;
  grandparentRatingKey?: string;
  title: string;
  guid: string;
  parentGuid?: string;
  grandparentGuid?: string;
  addedAt: number;
  updatedAt: number;
  Guid?: { id: string }[];
  type: 'movie' | 'show' | 'season' | 'episode';
  Media: Media[];
}

interface PlexLibraryResponse {
  MediaContainer: { totalSize: number; Metadata: PlexLibraryItem[] };
}

export interface PlexLibrary {
  type: 'show' | 'movie';
  key: string;
  title: string;
  agent: string;
}

interface PlexLibrariesResponse {
  MediaContainer: { Directory: PlexLibrary[] };
}

export interface PlexMetadata {
  ratingKey: string;
  parentRatingKey?: string;
  guid: string;
  type: 'movie' | 'show' | 'season';
  title: string;
  Guid: { id: string }[];
  Children?: { size: 12; Metadata: PlexMetadata[] };
  index: number;
  parentIndex?: number;
  leafCount: number;
  viewedLeafCount: number;
  addedAt: number;
  updatedAt: number;
  Media: Media[];
}

interface Media {
  id: number;
  duration: number;
  bitrate: number;
  width: number;
  height: number;
  aspectRatio: number;
  audioChannels: number;
  audioCodec: string;
  videoCodec: string;
  videoResolution: string;
  container: string;
  videoFrameRate: string;
  videoProfile: string;
}

interface PlexMetadataResponse {
  MediaContainer: { Metadata: PlexMetadata[] };
}

class PlexAPI {
  private plexClient: NodePlexAPI;

  constructor({
    plexToken,
    plexSettings,
    timeout,
  }: {
    plexToken?: string;
    plexSettings?: PlexSettings;
    timeout?: number;
  }) {
    const settings = getSettings();
    let settingsPlex: PlexSettings | undefined;
    plexSettings
      ? (settingsPlex = plexSettings)
      : (settingsPlex = getSettings().plex);

    this.plexClient = new NodePlexAPI({
      hostname: settingsPlex.ip,
      port: settingsPlex.port,
      https: settingsPlex.useSsl,
      timeout: timeout,
      token: plexToken,
      authenticator: {
        authenticate: (
          _plexApi,
          cb: (err?: string, token?: string) => void
        ) => {
          if (!plexToken) {
            return cb('Plex Token not found!');
          }
          cb(undefined, plexToken);
        },
      },
      options: {
        identifier: settings.clientId,
        product: 'Streamarr',
        deviceName: 'Streamarr',
        platform: 'Streamarr',
      },
    });
  }

  public async getStatus() {
    try {
      return await this.plexClient.query('/');
    } catch (e) {
      logger.error('Failed to get Plex status', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to get Plex status');
    }
  }

  public async getLibraries(): Promise<PlexLibrary[]> {
    try {
      const response =
        await this.plexClient.query<PlexLibrariesResponse>('/library/sections');
      return response.MediaContainer.Directory;
    } catch (e) {
      logger.error('Failed to fetch Plex libraries', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to fetch Plex libraries');
    }
  }

  public async syncLibraries(): Promise<void> {
    const settings = getSettings();
    try {
      const libraries = await this.getLibraries();
      const newLibraries: Library[] = libraries
        .filter((library) => library.agent !== 'com.plexapp.agents.none')
        .map((library) => {
          const existing = settings.plex.libraries.find(
            (l) => l.id === library.key && l.name === library.title
          );
          return {
            id: library.key,
            name: library.title,
            enabled: existing?.enabled ?? false,
            type: library.type,
            lastScan: existing?.lastScan,
          };
        });
      settings.plex.libraries = newLibraries;
    } catch (e) {
      logger.error('Failed to fetch Plex libraries', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      settings.plex.libraries = [];
    }
    settings.save();
  }

  public async getLibraryContents(
    id: string,
    { offset = 0, size = 50 }: { offset?: number; size?: number } = {}
  ): Promise<{ totalSize: number; items: PlexLibraryItem[] }> {
    try {
      const response = await this.plexClient.query<PlexLibraryResponse>({
        uri: `/library/sections/${id}/all?includeGuids=1`,
        extraHeaders: {
          'X-Plex-Container-Start': `${offset}`,
          'X-Plex-Container-Size': `${size}`,
        },
      });
      return {
        totalSize: response.MediaContainer.totalSize,
        items: response.MediaContainer.Metadata ?? [],
      };
    } catch (e) {
      logger.error('Failed to fetch Plex library contents', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to fetch Plex library contents');
    }
  }

  public async getMetadata(
    key: string,
    options: { includeChildren?: boolean } = {}
  ): Promise<PlexMetadata> {
    try {
      const response = await this.plexClient.query<PlexMetadataResponse>(
        `/library/metadata/${key}${
          options.includeChildren ? '?includeChildren=1' : ''
        }`
      );
      return response.MediaContainer.Metadata[0];
    } catch (e) {
      logger.error('Failed to fetch Plex metadata', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to fetch Plex metadata');
    }
  }

  public async getChildrenMetadata(key: string): Promise<PlexMetadata[]> {
    try {
      const response = await this.plexClient.query<PlexMetadataResponse>(
        `/library/metadata/${key}/children`
      );
      return response.MediaContainer.Metadata;
    } catch (e) {
      logger.error('Failed to fetch Plex children metadata', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to fetch Plex children metadata');
    }
  }

  public async getRecentlyAdded(
    id: string,
    options: { addedAt: number } = { addedAt: Date.now() - 1000 * 60 * 60 },
    mediaType: 'movie' | 'show'
  ): Promise<PlexLibraryItem[]> {
    try {
      const response = await this.plexClient.query<PlexLibraryResponse>({
        uri: `/library/sections/${id}/all?type=${
          mediaType === 'show' ? '4' : '1'
        }&sort=addedAt%3Adesc&addedAt>>=${Math.floor(options.addedAt / 1000)}`,
        extraHeaders: {
          'X-Plex-Container-Start': `0`,
          'X-Plex-Container-Size': `500`,
        },
      });
      return response.MediaContainer.Metadata;
    } catch (e) {
      logger.error('Failed to fetch Plex recently added', {
        label: 'Plex API',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      throw new Error('Failed to fetch Plex recently added');
    }
  }
}

export default PlexAPI;
