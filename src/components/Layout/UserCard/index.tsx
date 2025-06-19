'use client';
import CachedImage from '@app/components/Common/CachedImage';
import { NotificationContext } from '@app/context/NotificationContext';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  BellAlertIcon,
  HomeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';

const UserCard = () => {
  const { user } = useUser();
  const path = usePathname();
  const { setIsOpen } = useContext(NotificationContext);

  const { hasPermission } = useUser();

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
      <div className="absolute top-1 right-1">
        <button onClick={() => setIsOpen(true)} className="indicator">
          <span className="indicator-item indicator-start left-2 top-2 badge badge-sm font-thin badge-error h-5 hidden"></span>
          <BellAlertIcon className="size-8 m-1" />
        </button>
      </div>
      {path.match(/^\/(help\/?(.*)?|\/?$)/) && (
        <Link
          className={`btn btn-sm rounded-none w-full inline-flex justify-start btn-ghost`}
          href={'/watch'}
        >
          <HomeIcon className="size-5" />
          Home
        </Link>
      )}
      {hasPermission(Permission.ADMIN) && (
        <Link
          className={`btn btn-sm rounded-none w-full inline-flex justify-start ${path.match(/^\/admin\/?(.*)?$/) ? 'btn-primary' : 'btn-ghost'}`}
          href="/admin"
        >
          <LockClosedIcon className="size-5 inline-flex" />
          Admin Center
        </Link>
      )}
    </div>
  );
};
export default UserCard;
