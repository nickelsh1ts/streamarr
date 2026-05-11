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
  username?: string;
  displayName: string;
  email: string;
  avatar: string;
  permissions: number;
  userType: number;
  createdAt: Date;
  updatedAt: Date;
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
  notificationTypes: Partial<NotificationAgentTypes>;
  emailEnabled?: boolean;
  pgpKey?: string;
  webPushEnabled?: boolean;
  inAppEnabled?: boolean;
}

interface UserHookResponse {
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
}: { id?: number; initialData?: User } = {}): UserHookResponse => {
  const pathname = usePathname();
  const isAuthPage = /^\/(signin|signup|setup|resetpassword(?:\/|$))/.test(
    pathname || ''
  );

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<User>(id ? `/api/v1/user/${id}` : `/api/v1/auth/me`, {
    fallbackData: initialData,
    refreshInterval: !isAuthPage ? 30000 : 0,
    revalidateOnFocus: !isAuthPage,
    revalidateOnMount: !isAuthPage,
    revalidateOnReconnect: !isAuthPage,
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
