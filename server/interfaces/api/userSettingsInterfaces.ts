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
  plexSync?: 'synced' | 'removed' | 'failed' | 'skipped';
}

export type NotificationAgentTypes = Record<NotificationAgentKey, number>;
export interface UserSettingsNotificationsResponse {
  discordEnabled?: boolean;
  emailEnabled?: boolean;
  pgpKey?: string;
  pushbulletEnabled?: boolean;
  pushbulletAccessToken?: string;
  pushoverEnabled?: boolean;
  pushoverApplicationToken?: string;
  pushoverUserKey?: string;
  pushoverSound?: string;
  telegramEnabled?: boolean;
  telegramBotUsername?: string;
  telegramChatId?: string;
  telegramMessageThreadId?: string;
  telegramSendSilently?: boolean;
  webPushEnabled?: boolean;
  inAppEnabled?: boolean;
  discordId?: string;
  notificationTypes: Partial<NotificationAgentTypes>;
}

export interface UserNewsletterSubscription {
  id: number;
  name: string;
  description?: string | null;
  isImportant: boolean;
  subscribed: boolean;
}

export interface UserSettingsNewslettersResponse {
  newsletters: UserNewsletterSubscription[];
}
