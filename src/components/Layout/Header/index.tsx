'use client';
import Sidebar from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BackButton from '@app/components/Layout/BackButton';
import DynamicLogo from '@app/components/Layout/DynamicLogo';
import { useUser } from '@app/hooks/useUser';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage } from 'react-intl';

const Header = ({ isInView = true }) => {
  const path = usePathname();
  const { currentSettings } = useSettings();
  const { user } = useUser();

  return (
    <header
      id="top"
      className={`main navbar pt-[0.6rem] min-h-14 sticky top-0 transition duration-500 ${isInView ? (path.match(/\/(|signin|signup|resetpassword\/?(.*)?|help\/?(.*)?)?$/) ? 'bg-secondary backdrop-brightness-50' : 'bg-base-200') : ''} font-bold z-20`}
    >
      <div className="flex-1 max-sm:flex-wrap max-sm:place min-h-10">
        {!path.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && user && (
          <Sidebar />
        )}
        {(!path.match(/^\/$/) || user) && <BackButton />}
        <Link
          href={user ? '/watch' : '/'}
          className={`hover:brightness-75 transition-opacity duration-500 ml-0.5 -mt-1 md:ml-0.5 md:-mt-0.5 ${!isInView && 'opacity-0 pointer-events-none'}`}
        >
          <DynamicLogo />
        </Link>
        <div className={`ms-auto flex gap-2 place-items-center`}>
          {path.match(/\/$/) && !user && currentSettings.enableSignUp && (
            <Link
              href="/signup"
              id="signup"
              className={`btn btn-outline btn-sm md:btn-md text-xs btn-warning rounded-md gap-0.5 md:tracking-widest md:text-lg uppercase no-animation transition-opacity duration-500 ${!isInView && 'opacity-0 pointer-events-none'}`}
            >
              <FormattedMessage id="auth.signup" defaultMessage="Sign up now" />
            </Link>
          )}
          {user ? (
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
                className="btn btn-sm text- md:btn-md text-xs btn-primary rounded-md gap-0.5 md:tracking-widest uppercase md:text-lg print:hidden mr-2"
              >
                <FormattedMessage id="auth.signin" defaultMessage="Sign in" />
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
