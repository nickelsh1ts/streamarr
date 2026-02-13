import type { User } from '@server/entity/User';
import type Invite from '@server/entity/Invite';
import type { PaginatedResponse } from './common';
import type { Notification } from '@server/entity/Notification';

// Type for partial user data returned in invite responses
export type InviteCreatorSummary = Pick<User, 'id' | 'displayName' | 'avatar'>;

export interface UserResultsResponse extends PaginatedResponse {
  results: User[];
}

export interface UserInvitesResponse extends PaginatedResponse {
  results: Invite[];
}

export interface UserNotificationsResponse extends PaginatedResponse {
  results: Notification[];
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
