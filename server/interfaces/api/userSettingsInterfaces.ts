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
  globalSharedLibraries?: string;
}

export type NotificationAgentTypes = Record<NotificationAgentKey, number>;
export interface UserSettingsNotificationsResponse {
  emailEnabled?: boolean;
  pgpKey?: string;
  webPushEnabled?: boolean;
  notificationTypes: Partial<NotificationAgentTypes>;
}
