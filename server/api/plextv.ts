import type {
  PlexDevice,
  PlexPendingInvite,
  PlexPinnableLibrary,
  PlexServerSection,
  PlexSharePermissions,
  PlexSharedSection,
  PlexUserIdentity,
  PlexUserShare,
} from '@server/interfaces/api/plexInterfaces';
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
    allLibraries?: string;
    pending?: string;
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
        allowSync?: string;
        allowCameraUpload?: string;
        allowChannels?: string;
      };
      Server: ServerResponse[];
    }[];
  };
}

export interface DeprovisionResult {
  shareRevoked: boolean;
  friendRevoked: boolean;
  homeRevoked: boolean;
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

interface PlexSectionXml {
  $: {
    id: string;
    key: string;
    title: string;
    type: string;
    shared?: string;
  };
}

interface PlexServerSectionsXml {
  MediaContainer?: {
    Server?:
      | { Section?: PlexSectionXml | PlexSectionXml[] }
      | { Section?: PlexSectionXml | PlexSectionXml[] }[];
  };
}

interface PlexSharedServerXml {
  MediaContainer?: {
    SharedServer?: {
      Section?: PlexSectionXml | PlexSectionXml[];
    };
  };
}

interface PlexInviteXml {
  $: {
    id: string;
    friend?: string;
    home?: string;
    server?: string;
    email?: string;
    username?: string;
    friendlyName?: string;
  };
  Server?: { $: { name?: string } } | { $: { name?: string } }[];
}

interface PlexInvitesResponseXml {
  MediaContainer?: { Invite?: PlexInviteXml | PlexInviteXml[] };
}

interface PlexPinnedSource {
  key: string;
  machineIdentifier?: string;
  [field: string]: unknown;
}

interface PlexExperienceData {
  sidebarSettings?: {
    hasCompletedSetup?: boolean;
    pinnedSources?: PlexPinnedSource[];
    [field: string]: unknown;
  };
  [field: string]: unknown;
}

interface PlexUserSettingsResponse {
  value?: { id: string; type?: string; value?: string; hidden?: boolean }[];
}

const toArray = <T>(value: T | T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : value ? [value] : [];

/**
 * plex.tv XML endpoints return boolean attributes as either "1"/"0" or
 * "true"/"false" depending on the endpoint.
 */
const parsePlexBool = (value?: string | null): boolean =>
  value === '1' || value === 'true';

const extractFromErrorObject = (data: {
  errors?: unknown;
  error?: unknown;
}): string | undefined => {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0] as { message?: string } | string;
    const message = typeof first === 'string' ? first : first?.message;
    if (message) return message;
  }
  if (typeof data.error === 'string' && data.error) {
    return data.error;
  }
  return undefined;
};

/**
 * Extracts a human-readable error message from a plex.tv error response.
 * Legacy plex.tv endpoints return XML error bodies (<errors><error>…) while
 * newer ones return JSON — signup.ts depends on the message text surviving
 * (e.g. "already sharing this server with").
 */
export const extractPlexError = (error: unknown): string => {
  const fallback = error instanceof Error ? error.message : String(error);
  const data = (error as { response?: { data?: unknown } })?.response?.data;

  if (data && typeof data === 'object') {
    const message = extractFromErrorObject(
      data as { errors?: unknown; error?: unknown }
    );
    if (message) return message;
  }

  if (typeof data === 'string' && data) {
    try {
      const parsed = JSON.parse(data) as { errors?: unknown; error?: unknown };
      const message = extractFromErrorObject(parsed);
      if (message) return message;
    } catch {
      // Not JSON — fall through to XML/raw handling
    }
    const xmlMatch =
      data.match(/<error[^>]*>([^<]+)<\/error>/i) ??
      data.match(/status="([^"]+)"/i);
    if (xmlMatch?.[1]) return xmlMatch[1];
    return data.slice(0, 300);
  }

  return fallback;
};

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
      // Normalize Device to always be an array before mapping
      const devicesRaw = parsedXml?.MediaContainer?.Device;
      const devices = Array.isArray(devicesRaw)
        ? devicesRaw
        : devicesRaw
          ? [devicesRaw]
          : [];
      return devices.map((pxml: DeviceResponse) => {
        // Normalize Connection to always be an array before mapping
        const connectionsRaw = pxml?.Connection;
        const connections = Array.isArray(connectionsRaw)
          ? connectionsRaw
          : connectionsRaw
            ? [connectionsRaw]
            : [];
        return {
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
          connection: connections.map((conn: ConnectionResponse) => ({
            protocol: conn.$.protocol,
            address: conn.$.address,
            port: parseInt(conn.$.port, 10),
            uri: conn.$.uri,
            local: conn.$.local == '1',
          })),
        };
      });
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
      const usersRaw = usersResponse.MediaContainer.User;
      if (!usersRaw) {
        throw new Error("No users found in Plex account's shared list");
      }
      const users = Array.isArray(usersRaw) ? usersRaw : [usersRaw];
      const user = users.find((u) => parseInt(u.$.id) === userId);
      if (!user) {
        logger.warn(
          "This user does not exist on the main Plex account's shared list",
          { label: 'Plex.tv API', userId }
        );
        return false;
      }
      const serversRaw = user.Server;
      const servers = Array.isArray(serversRaw)
        ? serversRaw
        : serversRaw
          ? [serversRaw]
          : [];
      return !!servers.find(
        (server) => server.$.machineIdentifier === settings.plex.machineId
      );
    } catch (e) {
      logger.error(
        `Error checking user access: ${e instanceof Error ? e.message : String(e)}`
      );
      return false;
    }
  }

  public async getUsers(): Promise<UsersResponse> {
    const response = await this.axios.get('/api/users', {
      transformResponse: [],
      responseType: 'text',
    });
    const parsedXml = (await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      ignoreAttrs: false,
    })) as UsersResponse;
    return parsedXml;
  }

  public async deprovisionUser(
    userId: number,
    machineId: string
  ): Promise<DeprovisionResult> {
    const result: DeprovisionResult = {
      shareRevoked: false,
      friendRevoked: false,
      homeRevoked: false,
    };

    const safeUserId = Math.trunc(Number(userId));
    if (!Number.isFinite(safeUserId) || safeUserId <= 0) {
      throw new Error('Invalid userId: must be a positive integer.');
    }
    if (!/^[a-zA-Z0-9]+$/.test(machineId)) {
      throw new Error('Invalid machineId: must be alphanumeric.');
    }

    const usersResponse = await this.getUsers();
    const usersRaw = usersResponse.MediaContainer.User;
    const users = Array.isArray(usersRaw)
      ? usersRaw
      : usersRaw
        ? [usersRaw]
        : [];
    const targetUser = users.find((u) => parseInt(u.$.id, 10) === safeUserId);

    if (!targetUser) {
      throw new Error('User not found in Plex shared users list.');
    }

    const serversRaw = targetUser.Server;
    const servers = Array.isArray(serversRaw)
      ? serversRaw
      : serversRaw
        ? [serversRaw]
        : [];
    const sharedServer = servers.find(
      (server) => server.$.machineIdentifier === machineId
    );

    if (sharedServer?.$.id) {
      await this.axios.delete(
        `/api/servers/${machineId}/shared_servers/${sharedServer.$.id}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      result.shareRevoked = true;
    }

    // Best-effort cleanup. These endpoints may not be available in all Plex setups.
    try {
      await this.axios.delete(`/api/v2/friends/${safeUserId}`);
      result.friendRevoked = true;
    } catch {
      // no-op
    }

    try {
      await this.axios.delete(`/api/home/users/${safeUserId}`);
      result.homeRevoked = true;
    } catch {
      // no-op
    }

    return result;
  }

  private static readonly USER_SETTINGS_URL =
    'https://clients.plex.tv/api/v2/user/settings';

  private validateMachineId(machineId: string): void {
    if (!machineId) {
      throw new Error('Plex is not configured!');
    }
    if (!/^[a-zA-Z0-9]+$/.test(machineId)) {
      throw new Error('Invalid machineId: must be alphanumeric.');
    }
  }

  private async getXml<T>(url: string): Promise<T> {
    const response = await this.axios.get(url, {
      transformResponse: [],
      responseType: 'text',
    });
    return (await xml2js.parseStringPromise(response.data as string, {
      explicitArray: false,
      ignoreAttrs: false,
    })) as T;
  }

  private buildSharingSettings(
    permissions: PlexSharePermissions
  ): Record<string, string> {
    return {
      allowSync: permissions.allowSync ? '1' : '0',
      allowCameraUpload: permissions.allowCameraUpload ? '1' : '0',
      allowChannels: permissions.allowChannels ? '1' : '0',
      filterMovies: '',
      filterTelevision: '',
      filterMusic: '',
    };
  }

  /**
   * Returns all library sections on the server as reported by plex.tv,
   * including the global section `id` required by the shared_servers API
   * and the server-local `key` used throughout Streamarr settings.
   */
  public async getServerSections(
    machineId: string
  ): Promise<PlexServerSection[]> {
    this.validateMachineId(machineId);
    const parsed = await this.getXml<PlexServerSectionsXml>(
      `https://plex.tv/api/servers/${encodeURIComponent(machineId)}`
    );
    const servers = toArray(parsed?.MediaContainer?.Server);
    const sections = servers.flatMap((server) => toArray(server.Section));
    return sections.map((section) => ({
      id: parseInt(section.$.id, 10),
      key: section.$.key,
      title: section.$.title,
      type: section.$.type,
    }));
  }

  /**
   * Returns the share a user holds on the given server, or null when the
   * user (or their share) cannot be found.
   */
  public async getUserShare(
    identity: PlexUserIdentity,
    machineId: string
  ): Promise<PlexUserShare | null> {
    this.validateMachineId(machineId);
    const usersResponse = await this.getUsers();
    const users = toArray(usersResponse.MediaContainer.User);

    const target =
      (identity.plexId != null
        ? users.find((user) => parseInt(user.$.id, 10) === identity.plexId)
        : undefined) ??
      (identity.email
        ? users.find(
            (user) =>
              user.$.email &&
              user.$.email.toLowerCase() === identity.email?.toLowerCase()
          )
        : undefined) ??
      (identity.username
        ? users.find(
            (user) =>
              user.$.username &&
              user.$.username.toLowerCase() === identity.username?.toLowerCase()
          )
        : undefined);

    if (!target) {
      return null;
    }

    const servers = toArray(target.Server);
    const share = servers.find(
      (server) => server.$.machineIdentifier === machineId
    );

    if (!share?.$.id) {
      return null;
    }

    const sharingId = parseInt(share.$.id, 10);
    const parsed = await this.getXml<PlexSharedServerXml>(
      `https://plex.tv/api/servers/${encodeURIComponent(machineId)}/shared_servers/${encodeURIComponent(sharingId)}`
    );
    const sections: PlexSharedSection[] = toArray(
      parsed?.MediaContainer?.SharedServer?.Section
    ).map((section) => ({
      id: parseInt(section.$.id, 10),
      key: section.$.key,
      title: section.$.title,
      type: section.$.type,
      shared: parsePlexBool(section.$.shared),
    }));

    return {
      sharingId,
      accountId: parseInt(target.$.id, 10),
      pending: parsePlexBool(share.$.pending),
      allLibraries: parsePlexBool(share.$.allLibraries),
      sections,
      allowSync: parsePlexBool(target.$.allowSync),
      allowCameraUpload: parsePlexBool(target.$.allowCameraUpload),
      allowChannels: parsePlexBool(target.$.allowChannels),
    };
  }

  /**
   * Invites a user to this server (regular friend/server share).
   * `identifier` may be an email address or a Plex username — the
   * invited_email field accepts either.
   */
  public async inviteUserToServer(options: {
    identifier: string;
    machineId: string;
    sectionIds: number[];
    allowSync?: boolean;
    allowCameraUpload?: boolean;
    allowChannels?: boolean;
  }): Promise<void> {
    this.validateMachineId(options.machineId);
    await this.axios.post(
      `https://plex.tv/api/servers/${encodeURIComponent(options.machineId)}/shared_servers`,
      {
        server_id: options.machineId,
        shared_server: {
          library_section_ids: options.sectionIds,
          invited_email: options.identifier,
        },
        sharing_settings: this.buildSharingSettings(options),
      }
    );
  }

  /**
   * Invites a user to the owner's Plex Home and shares this server:
   * an existing friend only needs the Home invitation — their share
   * is already in place — while a new user gets the Home invite
   * followed by the server share.
   */
  public async inviteHomeUser(options: {
    identifier: string;
    machineId: string;
    sectionIds: number[];
    allowSync?: boolean;
    allowCameraUpload?: boolean;
    allowChannels?: boolean;
  }): Promise<void> {
    this.validateMachineId(options.machineId);
    const users = toArray((await this.getUsers()).MediaContainer.User);
    const identifierLower = options.identifier.toLowerCase();
    const existing = users.find(
      (user) =>
        user.$.email?.toLowerCase() === identifierLower ||
        user.$.username?.toLowerCase() === identifierLower
    );

    if (existing) {
      await this.axios.post(
        `https://plex.tv/api/home/users?invitedEmail=${encodeURIComponent(
          existing.$.username || options.identifier
        )}`
      );
      return;
    }

    await this.axios.post(
      `https://plex.tv/api/home/users?invitedEmail=${encodeURIComponent(options.identifier)}`
    );
    await this.axios.post(
      `https://plex.tv/api/servers/${encodeURIComponent(options.machineId)}/shared_servers`,
      {
        server_id: options.machineId,
        shared_server: {
          library_section_ids: options.sectionIds,
          invited_email: options.identifier,
        },
        sharing_settings: this.buildSharingSettings(options),
      }
    );
  }

  /**
   * Updates a user's shared library sections, and — only when permission
   * values are explicitly provided and differ from the current share —
   * recreates the share, which is the only reliable way to change
   * allowSync/allowCameraUpload/allowChannels. Permissions are tri-state:
   * undefined means "leave unchanged".
   */
  public async updateUserShare(options: {
    machineId: string;
    share: PlexUserShare;
    sectionIds: number[];
    permissions?: PlexSharePermissions;
  }): Promise<{ permissionsUpdated: boolean }> {
    this.validateMachineId(options.machineId);
    const { machineId, share, sectionIds, permissions } = options;
    const shareUrl = `https://plex.tv/api/servers/${encodeURIComponent(machineId)}/shared_servers/${encodeURIComponent(share.sharingId)}`;

    await this.axios.put(shareUrl, {
      server_id: machineId,
      shared_server: { library_section_ids: sectionIds },
    });

    const permissionsChanged =
      (permissions?.allowSync !== undefined &&
        permissions.allowSync !== share.allowSync) ||
      (permissions?.allowCameraUpload !== undefined &&
        permissions.allowCameraUpload !== share.allowCameraUpload) ||
      (permissions?.allowChannels !== undefined &&
        permissions.allowChannels !== share.allowChannels);

    if (!permissionsChanged) {
      return { permissionsUpdated: false };
    }

    const effectivePermissions: PlexSharePermissions = {
      allowSync: permissions?.allowSync ?? share.allowSync,
      allowCameraUpload:
        permissions?.allowCameraUpload ?? share.allowCameraUpload,
      allowChannels: permissions?.allowChannels ?? share.allowChannels,
    };

    await this.axios.delete(shareUrl);
    await this.axios.post(
      `https://plex.tv/api/servers/${encodeURIComponent(machineId)}/shared_servers`,
      {
        server_id: machineId,
        shared_server: {
          library_section_ids: sectionIds,
          invited_id: share.accountId,
        },
        sharing_settings: this.buildSharingSettings(effectivePermissions),
      }
    );

    return { permissionsUpdated: true };
  }

  /**
   * Returns the pending invites *received* by this token's account.
   * Use with a user-token PlexTvAPI instance for auto-accept flows.
   */
  public async getPendingReceivedInvites(): Promise<PlexPendingInvite[]> {
    const parsed = await this.getXml<PlexInvitesResponseXml>(
      '/api/invites/requests'
    );
    return toArray(parsed?.MediaContainer?.Invite).map((invite) => ({
      id: parseInt(invite.$.id, 10),
      friend: parsePlexBool(invite.$.friend),
      home: parsePlexBool(invite.$.home),
      server: parsePlexBool(invite.$.server),
      email: invite.$.email,
      username: invite.$.username,
      friendlyName: invite.$.friendlyName,
      serverNames: toArray(invite.Server)
        .map((server) => server.$?.name)
        .filter((name): name is string => !!name),
    }));
  }

  /**
   * Accepts a pending invite, echoing the invite's own friend/home/server
   * flags — this covers regular shares and Plex Home invites alike.
   */
  public async acceptInvite(invite: PlexPendingInvite): Promise<void> {
    const server = invite.server || (!invite.friend && !invite.home) ? 1 : 0;
    await this.axios.put(
      `https://plex.tv/api/invites/requests/${encodeURIComponent(invite.id)}`,
      undefined,
      {
        params: {
          friend: invite.friend ? 1 : 0,
          home: invite.home ? 1 : 0,
          server,
        },
      }
    );
  }

  /**
   * Pins the given libraries (plus Discover/Watchlist defaults) in the
   * user's Plex Web sidebar via clients.plex.tv user settings. Preserves
   * pins belonging to other servers. Use with a user-token instance.
   */
  public async pinServerLibraries(options: {
    machineId: string;
    serverName: string;
    libraries: PlexPinnableLibrary[];
  }): Promise<{ pinnedCount: number }> {
    this.validateMachineId(options.machineId);
    const { machineId, serverName, libraries } = options;

    // Fetch the user's current client settings. A brand-new Plex account
    // has no settings record yet and this GET returns 404
    let currentSettings: PlexUserSettingsResponse | null = null;
    try {
      const settingsResponse = await this.axios.get<PlexUserSettingsResponse>(
        PlexTvAPI.USER_SETTINGS_URL,
        {
          params: {
            sharedSettings: '1',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Version': '4.152.0',
            'X-Plex-Client-Identifier': 'streamarr',
          },
          timeout: 15000,
        }
      );
      currentSettings = settingsResponse.data;
    } catch {
      // No settings found or error fetching — we'll treat it as a blank slate and create the setting on POST
    }

    let experienceData: PlexExperienceData = {};
    let existingPinned: PlexPinnedSource[] = [];
    for (const setting of currentSettings?.value ?? []) {
      if (setting.id === 'experience') {
        experienceData = JSON.parse(setting.value || '{}');
        existingPinned = experienceData.sidebarSettings?.pinnedSources ?? [];
        break;
      }
    }

    const preservedPins = existingPinned.filter(
      (pin) => pin.machineIdentifier !== machineId
    );

    const byNumericId = (a: PlexPinnableLibrary, b: PlexPinnableLibrary) =>
      parseInt(a.id, 10) - parseInt(b.id, 10);
    const moviesAndShows = libraries
      .filter((lib) => lib.type === 'movie' || lib.type === 'show')
      .sort(byNumericId);
    const music = libraries
      .filter((lib) => lib.type === 'artist')
      .sort(byNumericId);
    const sortedLibraries = [...moviesAndShows, ...music];

    const typeMapping: Record<string, string> = {
      movie: 'movies',
      show: 'tv',
      artist: 'music',
    };
    const ourPinnedSources: PlexPinnedSource[] = sortedLibraries.map((lib) => {
      const sourceType = typeMapping[lib.type] ?? lib.type;
      return {
        key: `source--${sourceType}--${machineId}--com.plexapp.plugins.library--${lib.id}`,
        sourceType,
        machineIdentifier: machineId,
        providerIdentifier: 'com.plexapp.plugins.library',
        directoryID: lib.id,
        title: lib.name,
        serverFriendlyName: serverName,
        serverSourceTitle: null,
        isFullOwnedServer: true,
        hiddenAt: null,
      };
    });

    const discoverWatchlistDefaults: PlexPinnedSource[] = [
      {
        key: 'source--discover--myPlex--tv.plex.provider.discover--home',
        sourceType: 'discover',
        machineIdentifier: 'myPlex',
        providerIdentifier: 'tv.plex.provider.discover',
        directoryID: 'home',
        directoryIcon: 'https://provider-static.plex.tv/icons/discover-560.svg',
        title: 'Discover',
        serverFriendlyName: 'plex.tv',
        providerSourceTitle: null,
        isCloud: true,
        isFullOwnedServer: false,
        hiddenAt: null,
      },
      {
        key: 'source--watchlist--myPlex--tv.plex.provider.discover--watchlist',
        sourceType: 'watchlist',
        machineIdentifier: 'myPlex',
        providerIdentifier: 'tv.plex.provider.discover',
        directoryID: 'watchlist',
        directoryIcon: 'https://provider-static.plex.tv/icons/watchlist.svg',
        title: 'Watchlist',
        serverFriendlyName: 'plex.tv',
        providerSourceTitle: null,
        isCloud: true,
        isFullOwnedServer: false,
        hiddenAt: null,
      },
    ];

    const finalPinnedSources = [...preservedPins, ...ourPinnedSources];
    const existingKeys = new Set(finalPinnedSources.map((pin) => pin.key));
    for (const defaultSource of discoverWatchlistDefaults) {
      if (!existingKeys.has(defaultSource.key)) {
        finalPinnedSources.push(defaultSource);
      }
    }

    experienceData.sidebarSettings = {
      ...(experienceData.sidebarSettings ?? {}),
      hasCompletedSetup: true,
      pinnedSources: finalPinnedSources,
    };

    await this.axios.post(
      PlexTvAPI.USER_SETTINGS_URL,
      {
        value: JSON.stringify([
          {
            id: 'experience',
            type: 'json',
            value: JSON.stringify(experienceData),
            hidden: false,
          },
        ]),
      },
      {
        params: {
          sharedSettings: '1',
          'X-Plex-Product': 'Plex Web',
          'X-Plex-Version': '4.152.0',
          'X-Plex-Client-Identifier': 'streamarr-pin-libraries',
        },
        timeout: 15000,
      }
    );

    return { pinnedCount: ourPinnedSources.length };
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
        errorMessage: e.message,
      });
      throw e;
    }
  }
}

export default PlexTvAPI;
