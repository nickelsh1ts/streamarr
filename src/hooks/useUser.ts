import { UserType } from '@server/constants/user';
import type { PermissionCheckOptions } from '@server/lib/permissions';
import { hasPermission, Permission } from '@server/lib/permissions';
import type { NotificationAgentKey } from '@server/lib/settings';
import { usePathname } from 'next/navigation';
import type { MutatorCallback } from 'swr';
import useSWR from 'swr';

export { Permission, UserType };
export type { PermissionCheckOptions };

export interface User {
  id: number;
  plexUsername?: string;
  audiobookshelfId?: string;
  audiobookshelfUsername?: string;
  audiobookshelfPwNotifiedAt?: Date | null;
  shelfmarkUsername?: string | null;
  calibrewebUsername?: string | null;
  username?: string;
  displayName: string;
  email: string;
  avatar: string;
  permissions: number;
  userType: number;
  createdAt: Date;
  updatedAt: Date;
  active?: boolean;
  accessRevokedAt?: Date | null;
  accessRevokedReason?: 'trial_expired' | 'plex_removed' | null;
  inviteQuotaLimit?: number;
  inviteQuotaDays?: number;
  inviteCount?: number;
  inviteCountRedeemed?: number;
  settings?: UserSettings;
  redeemedInvite?: {
    id: number;
    createdBy?: {
      id: number;
      displayName: string;
      avatar: string;
    };
  };
}

type NotificationAgentTypes = Record<NotificationAgentKey, number>;

export interface UserSettings {
  locale?: string;
  sharedLibraries?: string | null;
  trialPeriodOutcome?: 'promote' | 'deactivate' | null;
  notificationTypes: Partial<NotificationAgentTypes>;
  discordEnabled?: boolean;
  gotifyEnabled?: boolean;
  emailEnabled?: boolean;
  ntfyEnabled?: boolean;
  pgpKey?: string;
  pushbulletEnabled?: boolean;
  pushbulletAccessToken?: string;
  pushoverEnabled?: boolean;
  pushoverApplicationToken?: string;
  pushoverUserKey?: string;
  pushoverSound?: string;
  slackEnabled?: boolean;
  telegramEnabled?: boolean;
  telegramChatId?: string;
  telegramMessageThreadId?: string;
  telegramSendSilently?: boolean;
  webhookEnabled?: boolean;
  webPushEnabled?: boolean;
  inAppEnabled?: boolean;
  discordId?: string;
}

export interface UserHookResponse {
  user?: User;
  loading: boolean;
  error: string;
  revalidate: (
    data?: User | Promise<User> | MutatorCallback<User> | undefined,
    shouldRevalidate?: boolean | undefined
  ) => Promise<User | undefined>;
  hasPermission: (
    permission: Permission | Permission[],
    options?: PermissionCheckOptions
  ) => boolean;
}

export const useUser = ({
  id,
  initialData,
  disableAutoRevalidation,
}: {
  id?: number;
  initialData?: User;
  disableAutoRevalidation?: boolean;
} = {}): UserHookResponse => {
  const pathname = usePathname();
  const isPublicRoute =
    pathname === '/' ||
    /^\/(?:signin(?:\/plex\/loading)?|signup|resetpassword(?:\/.*)?|setup|help(?:\/.*)?)$/.test(
      pathname || ''
    );
  const shouldDisableAutoRevalidation =
    disableAutoRevalidation ?? (!id && isPublicRoute);

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<User>(id ? `/api/v1/user/${id}` : `/api/v1/auth/me`, {
    fallbackData: initialData,
    refreshInterval: shouldDisableAutoRevalidation ? 0 : 30000,
    revalidateOnFocus: !shouldDisableAutoRevalidation,
    revalidateOnMount: !shouldDisableAutoRevalidation,
    revalidateOnReconnect: !shouldDisableAutoRevalidation,
    errorRetryInterval: 30000,
    shouldRetryOnError: false,
  });

  const checkPermission = (
    permission: Permission | Permission[],
    options?: PermissionCheckOptions
  ): boolean => {
    return hasPermission(permission, data?.permissions ?? 0, options);
  };

  return {
    user: data,
    loading: !data && !error,
    error,
    hasPermission: checkPermission,
    revalidate,
  };
};
