import type { PaginatedResponse } from './common';

export type LogMessage = {
  timestamp: string;
  level: string;
  label?: string;
  message: string;
  data?: Record<string, unknown>;
};

export interface LogsResultsResponse extends PaginatedResponse {
  results: LogMessage[];
}

export interface SettingsAboutResponse {
  version: string;
  totalUsers?: number;
  totalInvites?: number;
  tz?: string;
  appDataPath: string;
}

export interface PublicSettingsResponse {
  initialized: boolean;
  applicationTitle: string;
  applicationUrl: string;
  localLogin: boolean;
  region: string;
  cacheImages: boolean;
  vapidPublic: string;
  enablePushRegistration: boolean;
  locale: string;
  emailEnabled: boolean;
  newPlexLogin: boolean;
  enableRequest: boolean;
  requestUrl: string;
  supportUrl: string;
  supportEmail: string;
  extendedHome: boolean;
  enableSignUp: boolean;
  releaseSched: boolean;
  statsUrl: string;
  statusUrl: string;
  statusEnabled: boolean;
  customLogo?: string;
  customLogoSmall?: string;
}

export interface CacheItem {
  id: string;
  name: string;
  stats: {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
  };
}

export interface CacheResponse {
  apiCaches: CacheItem[];
  imageCache: {
    tmdb: { size: number; imageCount: number };
    qrcode: { size: number; imageCount: number };
  };
}

export interface StatusResponse {
  version: string;
  commitTag: string;
  updateAvailable: boolean;
  commitsBehind: number;
}
