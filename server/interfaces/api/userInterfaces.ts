import type { User } from '@server/entity/User';
import type Invite from '@server/entity/Invite';
import type { PaginatedResponse } from './common';

export interface UserResultsResponse extends PaginatedResponse {
  results: User[];
}

export interface UserInvitesResponse extends PaginatedResponse {
  results: Invite[];
}

export interface QuotaStatus {
  days?: number;
  limit?: number;
  used: number;
  remaining?: number;
  restricted: boolean;
}

export interface QuotaResponse {
  invite: QuotaStatus;
}
