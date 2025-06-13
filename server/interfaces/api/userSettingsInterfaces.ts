import type { NotificationAgentKey } from '@server/lib/settings';

export interface UserSettingsGeneralResponse {
  username?: string;
  locale?: string;
  region?: string;
  originalLanguage?: string;
}

export type NotificationAgentTypes = Record<NotificationAgentKey, number>;
export interface UserSettingsNotificationsResponse {
  emailEnabled?: boolean;
  pgpKey?: string;
  webPushEnabled?: boolean;
  notificationTypes: Partial<NotificationAgentTypes>;
}
