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

export interface UserBulkUpdatePlexSyncSummary {
  synced: number;
  failed: number;
  removed: number;
}

export interface UserBulkUpdateResponse {
  users: Partial<User>[];
  plexSync?: UserBulkUpdatePlexSyncSummary;
}

export interface UserInvitesResponse extends PaginatedResponse {
  results: Invite[];
}

export interface UserNotificationsResponse extends PaginatedResponse {
  results: Notification[];
}

export interface WatchHistoryItem {
  ratingKey: number;
  grandparentRatingKey: number | null;
  title: string;
  grandparentTitle: string | null;
  mediaType: 'movie' | 'episode';
  thumb: string | null;
  summary: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  percentComplete: number;
  plexUrl: string | null;
  deletedFromPlex: boolean;
  plexThumbReliable: boolean;
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
