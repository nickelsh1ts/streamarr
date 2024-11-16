'use client';
import Sidebar from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthed } from '@app/app/layout';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const Header = ({ isInView = true }) => {
  const path = usePathname();
  const router = useRouter();

  return (
    <header
      id="top"
      className={`navbar sticky top-0 transition duration-500 ${isInView && 'bg-brand-dark'} font-bold z-10`}
    >
      <div className="flex-1 max-sm:flex-wrap max-sm:place min-h-10">
        {!path.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && isAuthed && (
          <Sidebar />
        )}
        <button onClick={() => router.back()} className="pwa-only">
          <ArrowLeftIcon className="size-7 m-2" />
        </button>
        <Link
          href="/"
          className={`hover:brightness-75 transition-opacity duration-500 ml-2 ${!isInView && 'opacity-0 pointer-events-none'}`}
        >
          <img
            src="/logo_full.png"
            alt="logo"
            className="w-40 sm:w-48 h-auto"
          />
        </Link>
        <div className={`ms-auto flex gap-2 place-items-center`}>
          {path.match(/\/$/) && !isAuthed && (
            <Link
              href="/signup"
              id="signup"
              className={`btn btn-outline btn-sm md:btn-md text-xs btn-warning rounded-md gap-0.5 md:tracking-widest md:text-lg uppercase no-animation transition-opacity duration-500 ${!isInView && 'opacity-0 pointer-events-none'}`}
            >
              Sign up now
            </Link>
          )}
          {isAuthed ? (
            !path.match(/^\/(help\/?(.*)?|\/?$|signup\/?|signin\/?)/) ? (
              <div className="max-sm:hidden">
                <UserDropdown />
              </div>
            ) : (
              <UserDropdown />
            )
          ) : (
            !path.match(/^\/signin\/?$/) && (
              <Link
                href="/signin"
                id="signin"
                className="btn btn-sm text- md:btn-md text-xs btn-primary rounded-md gap-0.5 md:tracking-widest uppercase md:text-lg hover:btn-secondary print:hidden mr-2"
              >
                Sign in{' '}
                <ArrowRightEndOnRectangleIcon className="size-4 md:size-6" />
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
