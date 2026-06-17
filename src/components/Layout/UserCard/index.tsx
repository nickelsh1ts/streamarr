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
    <div className="text-base-content pointer-events-auto relative w-64">
      <Link
        href="/profile"
        className="bg-neutral/20 hover:bg-neutral/30 flex flex-col place-content-center items-center gap-2 p-4"
      >
        <CachedImage
          className="ring-primary-content shadow-3xl inline-block h-16 w-16 rounded-full ring-1"
          src={user?.id ? `/avatarproxy/${user.id}` : undefined}
          alt="user"
          width={64}
          height={64}
        />
        <div className="flex w-full flex-col place-content-start">
          <p className="truncate text-center text-lg leading-tight capitalize">
            {user?.displayName}
          </p>
          <p className="truncate text-center text-xs leading-tight lowercase">
            {user?.email}
          </p>
        </div>
      </Link>
      {notificationSettings?.inAppEnabled && (
        <div className="absolute top-1 right-1">
          <button
            onClick={() => setIsOpen(true)}
            className="indicator hover:cursor-pointer"
          >
            {unRead > 0 && (
              <span className="indicator-item indicator-top indicator-end badge badge-xs badge-error top-2 right-2 py-2 text-xs font-thin">
                {unRead}
              </span>
            )}
            {unRead > 0 ? (
              <BellAlertIcon className="m-1 size-8" />
            ) : (
              <BellIcon className="m-1 size-8" />
            )}
          </button>
        </div>
      )}
      {path.match(/^\/(help\/?(.*)?|\/?$)/) && (
        <Link
          className={`btn btn-sm btn-ghost hover:bg-neutral/20 inline-flex w-full justify-start rounded-none`}
          href={'/watch'}
        >
          <HomeIcon className="size-5" />
          <FormattedMessage id="common.home" defaultMessage="Home" />
        </Link>
      )}
      {hasPermission(Permission.ADMIN) ? (
        <Link
          className={`btn btn-sm inline-flex w-full justify-start rounded-none ${path.match(/^\/admin\/?(.*)?$/) ? 'btn-primary' : 'btn-ghost hover:bg-neutral/20'}`}
          href="/admin"
        >
          <LockClosedIcon className="inline-flex size-5" />
          <FormattedMessage
            id="common.adminCentre"
            defaultMessage="Admin Centre"
          />
        </Link>
      ) : hasPermission(Permission.MANAGE_USERS) ? (
        <Link
          className={`btn btn-sm inline-flex w-full justify-start rounded-none ${path.match(/^\/admin\/users\/?(.*)?$/) ? 'btn-primary' : 'btn-ghost hover:bg-neutral/20'}`}
          href="/admin/users"
        >
          <LockClosedIcon className="inline-flex size-5" />
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
