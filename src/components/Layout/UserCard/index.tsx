'use client';
import CachedImage from '@app/components/Common/CachedImage';
import { useNotificationSidebar } from '@app/context/NotificationSidebarContext';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  BellAlertIcon,
  BellIcon,
  HomeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import type { UserNotificationsResponse } from '@server/interfaces/api/userInterfaces';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const UserCard = ({
  notifications,
}: {
  notifications?: UserNotificationsResponse;
}) => {
  const { user } = useUser();
  const path = usePathname();
  const { setIsOpen } = useNotificationSidebar();
  const { data: notificationSettings } =
    useSWR<UserSettingsNotificationsResponse>(
      user ? `/api/v1/user/${user?.id}/settings/notifications` : null
    );

  const { hasPermission } = useUser();

  const unRead =
    notifications?.results.filter((notification) => !notification.isRead)
      .length ?? 0;

  return (
    <div className="pointer-events-auto w-64 relative">
      <Link
        href="/profile"
        className="flex flex-col items-center place-content-center gap-2 p-4 bg-slate-50/10 hover:bg-slate-50/20"
      >
        <CachedImage
          className="inline-block h-16 w-16 rounded-full ring-1 ring-primary-content shadow-3xl"
          src={user?.avatar}
          alt="user"
          width={64}
          height={64}
        />
        <div className="flex flex-col w-full place-content-start">
          <p className="text-lg text-center leading-tight truncate capitalize">
            {user?.displayName}
          </p>
          <p className="text-xs text-center leading-tight truncate lowercase">
            {user?.email}
          </p>
        </div>
      </Link>
      {notificationSettings?.inAppEnabled && (
        <div className="absolute top-1 right-1">
          <button onClick={() => setIsOpen(true)} className="indicator">
            {unRead > 0 && (
              <span className="indicator-item indicator-top indicator-end top-2 right-2 badge badge-xs py-2 text-xs font-thin badge-error">
                {unRead}
              </span>
            )}
            {unRead > 0 ? (
              <BellAlertIcon className="size-8 m-1" />
            ) : (
              <BellIcon className="size-8 m-1" />
            )}
          </button>
        </div>
      )}
      {path.match(/^\/(help\/?(.*)?|\/?$)/) && (
        <Link
          className={`btn btn-sm rounded-none w-full inline-flex justify-start btn-ghost`}
          href={'/watch'}
        >
          <HomeIcon className="size-5" />
          <FormattedMessage id="common.home" defaultMessage="Home" />
        </Link>
      )}
      {hasPermission(Permission.ADMIN) ? (
        <Link
          className={`btn btn-sm rounded-none w-full inline-flex justify-start ${path.match(/^\/admin\/?(.*)?$/) ? 'btn-primary' : 'btn-ghost'}`}
          href="/admin"
        >
          <LockClosedIcon className="size-5 inline-flex" />
          <FormattedMessage
            id="common.adminCentre"
            defaultMessage="Admin Centre"
          />
        </Link>
      ) : hasPermission(Permission.MANAGE_USERS) ? (
        <Link
          className={`btn btn-sm rounded-none w-full inline-flex justify-start ${path.match(/^\/admin\/users\/?(.*)?$/) ? 'btn-primary' : 'btn-ghost'}`}
          href="/admin/users"
        >
          <LockClosedIcon className="size-5 inline-flex" />
          <FormattedMessage
            id="common.manageUsers"
            defaultMessage="Manage Users"
          />
        </Link>
      ) : null}
    </div>
  );
};
export default UserCard;
