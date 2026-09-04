import type { ServiceSettings } from '@server/lib/settings';
import ExternalAPI from './externalapi';

export type AudiobookshelfConnection = Pick<
  ServiceSettings,
  'hostname' | 'port' | 'useSsl' | 'apiKey'
>;

export interface Permissions {
  download: boolean;
  update: boolean;
  delete: boolean;
  upload: boolean;
  accessAllLibraries: boolean;
  accessAllTags: boolean;
  accessExplicitContent: boolean;
}

export interface ServerSettings {
  serverSettings: {
    id: string;
    scannerFindCovers: boolean;
    scannerCoverProvider: string;
    scannerParseSubtitle: boolean;
    scannerPreferMatchedMetadata: boolean;
    scannerDisableWatcher: boolean;
    storeCoverWithItem: boolean;
    storeMetadataWithItem: boolean;
    metadataFileFormat: string;
    rateLimitLoginRequests: number;
    rateLimitLoginWindow: number;
    backupSchedule: string;
    backupsToKeep: number;
    maxBackupSize: number;
    loggerDailyLogsToKeep: number;
    loggerScannerLogsToKeep: number;
    homeBookshelfView: number;
    bookshelfView: number;
    sortingIgnorePrefix: boolean;
    sortingPrefixes: string[];
    chromecastEnabled: boolean;
    dateFormat: string;
    timeFormat: string;
    language: string;
    logLevel: number;
    version: string;
  };
}

export interface User {
  id: string;
  username: string;
  email?: string | null;
  type: 'user' | 'guest' | 'admin' | 'root';
  token: string;
  mediaProgress: unknown[];
  seriesHideFromContinueListening: string[];
  bookmarks: unknown[];
  isActive: boolean;
  isLocked: boolean;
  lastSeen: number;
  createdAt: number;
  permissions: Permissions;
  librariesAccessible: string[];
  itemTagsAccessible: string[];
}

interface UserListResponse {
  users: User[];
}

interface UserResponse {
  user: User;
}

interface LibraryListResponse {
  libraries: Library[];
}

export interface createUser extends Record<string, unknown> {
  username: string;
  password: string;
  type: 'user' | 'guest' | 'admin';
  isActive?: boolean;
  isLocked?: boolean;
  permissions?: Permissions;
  mediaProgress?: unknown[];
  bookmarks?: unknown[];
  seriesHideFromContinueListening?: string[];
  lastSeen?: number;
  createdAt?: number;
  librariesAccessible?: string[];
  itemTagsAccessible?: string[];
}

export interface Library {
  id: string;
  name: string;
  folders: {
    id: string;
    fullPath: string;
    libraryId: string;
  }[];
  displayOrder: number;
  icon: string;
  mediaType: string;
  provider: string;
  settings: {
    coverAspectRatio: number;
    disableWatcher: boolean;
    skipMatchingMediaWithAsin: boolean;
    skipMatchingMediaWithIsbn: boolean;
    autoScanCronExpression: string | null;
  };
  createdAt: number;
  lastUpdate: number;
}

export interface LibraryItemResults {
  results: {
    id: string;
    ino: string;
    libraryId: string;
    folderId: string;
    path: string;
    relPath: string;
    isFile: boolean;
    mtimeMs: number;
    ctimeMs: number;
    birthtimeMs: number;
    addedAt: number;
    updatedAt: number;
    isMissing: boolean;
    isInvalid: boolean;
    mediaType: string;
    media: {
      metadata: {
        title: string;
        titleIgnorePrefix: string;
        subtitle: string | null;
        authorName: string;
        narratorName: string;
        seriesName: string;
        genres: string[];
        publishedYear: string;
        publishedDate: string | null;
        publisher: string;
        description: string;
        isbn: string | null;
        asin: string;
        language: string | null;
        explicit: boolean;
      };
      coverPath: string;
      tags: string[];
      numTracks: number;
      numAudioFiles: number;
      numChapters: number;
      duration: number;
      size: number;
      ebookFileFormat: string | null;
    };
    numFiles: number;
    size: number;
    collapsedSeries: {
      id: string;
      name: string;
      nameIgnorePrefix: string;
      numBooks: number;
    };
  }[];
  total: number;
  limit: number;
  page: number;
  sortBy: string;
  sortDesc: boolean;
  filterBy: string;
  mediaType: string;
  minified: boolean;
  collapseseries: boolean;
  include: string;
}

class AudiobookshelfAPI extends ExternalAPI {
  static buildUrl(settings: AudiobookshelfConnection, path?: string): string {
    const protocol = settings.useSsl ? 'https' : 'http';
    return `${protocol}://${settings.hostname}:${settings.port}${path ?? ''}`;
  }

  public async getVersion(): Promise<string> {
    try {
      const data = await this.post<ServerSettings>('/api/authorize', {});

      return data.serverSettings.version;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to retrieve version: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      const data = await this.get<UserListResponse>('/api/users');

      return data.users;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to retrieve users: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async createUser(userData: createUser): Promise<User> {
    try {
      const data = await this.post<UserResponse>('/api/users', userData);

      return data.user;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to create user: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  /**
   * Logs in with real user credentials to obtain a proper session (a
   * short-lived access token plus a refresh token), as opposed to a
   * long-lived API key. Required for the embedded web client, which expects
   * an access-token session it can refresh via `/auth/refresh`.
   */
  public async login(
    username: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const data = await this.post<{
        user: { accessToken: string; refreshToken: string };
      }>(
        '/login',
        { username, password },
        { headers: { 'x-return-tokens': 'true' } }
      );

      return {
        accessToken: data.user.accessToken,
        refreshToken: data.user.refreshToken,
      };
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to log in as "${username}": ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async logout(refreshToken: string): Promise<void> {
    try {
      await this.post(
        '/logout',
        {},
        {
          headers: { 'x-refresh-token': refreshToken },
        }
      );
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to log out: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getAvailableUsername(username: string): Promise<string> {
    const users = await this.getAllUsers();
    const usernames = new Set(
      users.map((user) => user.username.toLocaleLowerCase())
    );

    if (!usernames.has(username.toLocaleLowerCase())) {
      return username;
    }

    let suffix = 2;
    while (usernames.has(`${username}${suffix}`.toLocaleLowerCase())) {
      suffix += 1;
    }

    return `${username}${suffix}`;
  }

  public async updateUser(
    userId: string,
    userData: Partial<createUser>
  ): Promise<User> {
    try {
      const data = await this.patch<User>(`/api/users/${userId}`, userData);

      return data;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to update user: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getAllLibraries(): Promise<Library[]> {
    try {
      const data = await this.get<LibraryListResponse>('/api/libraries');

      return data.libraries;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to retrieve libraries: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getLibraryById(libraryId: string): Promise<Library> {
    try {
      const data = await this.get<Library>(`/api/libraries/${libraryId}`);

      return data;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to retrieve library by ID: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  public async getLibraryItems(libraryId: string): Promise<LibraryItemResults> {
    try {
      const data = await this.get<LibraryItemResults>(
        `/api/libraries/${libraryId}/items`
      );

      return data;
    } catch (e) {
      throw new Error(
        `[Audiobookshelf] Failed to retrieve library items: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

export default AudiobookshelfAPI;
