import type { PaginatedResponse } from './common';

export interface SeerrQuotaResponse {
  movieQuotaLimit: number | null;
  movieQuotaDays: number | null;
  movieQuotaRemaining?: number | null;
  tvQuotaLimit: number | null;
  tvQuotaDays: number | null;
  tvQuotaRemaining?: number | null;
}

export interface SeerrNotificationsResponse {
  enabledAgents: string[];
}

export interface SeerrRequestItem {
  id: number;
  type: 'movie' | 'tv';
  requestStatus: number;
  mediaStatus: number;
  media: { tmdbId: number };
  seasons: { id: number; seasonNumber: number }[];
  requestedBy: { id: number; displayName: string; avatar: string | null };
  createdAt: string;
}

export interface SeerrRequestsResponse extends PaginatedResponse {
  results: SeerrRequestItem[];
}
