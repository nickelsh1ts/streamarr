import type { NotificationAgentKey } from '@server/lib/settings';

export interface UserSettingsGeneralResponse {
  username?: string;
  locale?: string;
  inviteQuotaLimit?: number;
  inviteQuotaDays?: number;
  globalInviteQuotaDays?: number;
  globalInviteQuotaLimit?: number;
  globalInviteUsageLimit?: number;
  globalInvitesExpiryLimit?: number;
  globalInvitesExpiryTime?: 'days' | 'weeks' | 'months';
  globalAllowDownloads?: boolean;
  globalLiveTv?: boolean;
  globalPlexHome?: boolean;
  sharedLibraries?: string;
  allowDownloads?: boolean;
  allowLiveTv?: boolean;
  allowPlexHome?: boolean;
  globalSharedLibraries?: string;
  trialPeriodEndsAt?: Date | null;
  trialPeriodOutcome?: 'promote' | 'deactivate' | null;
  trialExtensionRequested?: boolean;
  trialExtensionRequestedAt?: Date | null;
  globalEnableTrialPeriod?: boolean;
  globalTrialPeriodDays?: number;
  globalTrialPeriodOutcome?: 'promote' | 'deactivate';
  tautulliBaseUrl?: string;
  tautulliEnabled?: boolean;
  forcePlexSync?: boolean;
  requestUrl?: string;
  requestHostname?: string;
  requestEnabled?: boolean;
  releaseSched?: boolean;
}

export type NotificationAgentTypes = Record<NotificationAgentKey, number>;
export interface UserSettingsNotificationsResponse {
  emailEnabled?: boolean;
  pgpKey?: string;
  webPushEnabled?: boolean;
  inAppEnabled?: boolean;
  notificationTypes: Partial<NotificationAgentTypes>;
}
