'use client';
import { BellAlertIcon, HomeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserType {
  name: string;
  email: string;
  admin: boolean;
}

const user: UserType = {
  name: 'nickelsh1ts',
  email: 'ni.wege@gmail.com',
  admin: true,
};

const UserCard = () => {
  const path = usePathname();

  return (
    <div className="pointer-events-auto max-sm:w-64 relative">
        <Link
          href="/u/profile"
          className="flex flex-col items-center place-content-center gap-2 p-4 bg-slate-50/10 hover:bg-slate-50/20"
        >
          <img
            className="inline-block h-10 w-10 rounded-full ring-1 ring-primary-content shadow-3xl"
            src="/android-chrome-192x192.png"
            alt="user"
          />
          <div className="flex flex-col w-full place-content-start">
            <p className="text-lg text-center leading-tight truncate capitalize">
              {user.name}
            </p>
            <p className="text-xs text-center leading-tight truncate lowercase">
              {user.email}
            </p>
          </div>
        </Link>
        <div className='absolute top-0 right-0'>
          <BellAlertIcon className='size-6 m-1' />
        </div>
        {!path.includes('/watch/web/index') && (
          <Link className={`btn btn-sm rounded-none w-full inline-flex ${path.includes('/watch/web/index') ? 'btn-primary' : 'btn-ghost'}`} href={'/watch'}>
            <HomeIcon className='size-5' />
            Home
          </Link>
        )}
        {user.admin && (
          <Link
            className={`btn btn-sm rounded-none w-full inline-flex ${path.includes('/admin') ? 'btn-primary' : 'btn-ghost'}`}
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
