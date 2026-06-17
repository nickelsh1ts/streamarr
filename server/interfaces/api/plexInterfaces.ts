import type { PlexSettings } from '@server/lib/settings';

export interface PlexStatus {
  settings: PlexSettings;
  status: number;
  message: string;
}

export interface PlexConnection {
  protocol: string;
  address: string;
  port: number;
  uri: string;
  local: boolean;
  status?: number;
  message?: string;
}

export interface PlexDevice {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  platformVersion: string;
  device: string;
  clientIdentifier: string;
  createdAt: Date;
  lastSeenAt: Date;
  provides: string[];
  owned: boolean;
  accessToken?: string;
  publicAddress?: string;
  httpsRequired?: boolean;
  synced?: boolean;
  relay?: boolean;
  dnsRebindingProtection?: boolean;
  natLoopbackSupported?: boolean;
  publicAddressMatches?: boolean;
  presence?: boolean;
  ownerID?: string;
  home?: boolean;
  sourceTitle?: string;
  connection: PlexConnection[];
}

export interface PlexServerSection {
  /** Global section id — required by the plex.tv shared_servers API */
  id: number;
  /** Server-local section key — matches settings.plex.libraries[].id */
  key: string;
  title: string;
  type: string;
}

export interface PlexSharedSection {
  id: number;
  key: string;
  title: string;
  type: string;
  shared: boolean;
}

export interface PlexUserShare {
  /** The shared_servers/{id} identifier for this user's share */
  sharingId: number;
  /** The user's Plex account id */
  accountId: number;
  /** True while the share invite has not been accepted yet */
  pending: boolean;
  /** True for legacy/manual "all libraries" shares */
  allLibraries: boolean;
  sections: PlexSharedSection[];
  allowSync: boolean;
  allowCameraUpload: boolean;
  allowChannels: boolean;
}

export interface PlexSharePermissions {
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
}

export interface PlexPendingInvite {
  id: number;
  friend: boolean;
  home: boolean;
  server: boolean;
  email?: string;
  username?: string;
  friendlyName?: string;
  serverNames: string[];
}

export interface PlexUserIdentity {
  plexId?: number;
  email?: string;
  username?: string;
}

export interface PlexPinnableLibrary {
  /** Server-local section key (settings.plex.libraries[].id) */
  id: string;
  name: string;
  type: string;
}
