import type { User } from '@server/entity/User';
import type Invite from '@server/entity/Invite';
import type { PaginatedResponse } from './common';
import type { Notification } from '@server/entity/Notification';

export interface UserSummary {
  id: number;
  displayName: string;
  avatar: string;
}

export interface UserResultsResponse extends PaginatedResponse {
  results: User[];
}

export interface UserInvitesResponse extends PaginatedResponse {
  results: Invite[];
}

export interface UserNotificationsResponse extends PaginatedResponse {
  results: Notification[];
}

export interface WatchHistoryItem {
  rating_key: number;
  grandparent_rating_key: number | null;
  title: string;
  grandparent_title: string | null;
  media_type: 'movie' | 'episode';
  thumb: string | null;
  summary: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  percent_complete: number;
  plex_url: string | null;
  deleted_from_plex: boolean;
}

export interface UserWatchDataResponse {
  results: WatchHistoryItem[];
}

export interface QuotaStatus {
  days?: number;
  limit?: number;
  used: number;
  remaining?: number;
  restricted: boolean;
  trialPeriodActive?: boolean;
  trialPeriodEndsAt?: Date | null;
  trialPeriodEnabled?: boolean;
}

export interface QuotaResponse {
  invite: QuotaStatus;
}
