'use client';
import Sidebar from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthed } from '@app/app/layout';
import BackButton from '@app/components/Layout/BackButton';
import DynamicLogo from '@app/components/Layout/DynamicLogo';

const Header = ({ isInView = true }) => {
  const path = usePathname();

  return (
    <header
      id="top"
      className={`navbar pt-[0.6rem] min-h-14 sticky top-0 transition duration-500 ${isInView ? (path.match(/\/(|signin|signup|help\/?(.*)?)?$/) ? 'bg-brand-dark' : 'bg-[#161616]') : ''} font-bold z-10`}
    >
      <div className="flex-1 max-sm:flex-wrap max-sm:place min-h-10">
        {!path.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && isAuthed && (
          <Sidebar />
        )}
        {(!path.match(/^\/$/) || isAuthed) && <BackButton />}
        <Link
          href={isAuthed ? '/watch' : '/'}
          className={`hover:brightness-75 transition-opacity duration-500 ml-0.5 -mt-1 md:ml-0.5 md:-mt-0.5 ${!isInView && 'opacity-0 pointer-events-none'}`}
        >
          <DynamicLogo />
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
              <div className="max-sm:hidden -mt-1">
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
