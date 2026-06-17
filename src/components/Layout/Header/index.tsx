'use client';
import BackButton from '@app/components/Layout/BackButton';
import DynamicLogo from '@app/components/Layout/DynamicLogo';
import Sidebar from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

const Header = ({ isInView = true }) => {
  const path = usePathname();
  const { currentSettings } = useSettings();
  const { user } = useUser();
  const homeHref = !user?.active ? '/profile/settings/general' : '/watch';

  return (
    <header
      id="top"
      data-tutorial="main-header"
      className={`main navbar sticky top-0 min-h-14 pt-[0.6rem] transition duration-500 ${isInView ? (path.match(/\/(|signin|signup|resetpassword\/?(.*)?|help\/?(.*)?)?$/) ? 'bg-secondary backdrop-brightness-50' : 'bg-base-200') : ''} z-20 font-bold`}
    >
      <div className="max-sm:place flex min-h-10 flex-1 items-center max-sm:flex-wrap">
        {!path.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && user && (
          <Sidebar />
        )}
        {(!path.match(/^\/$/) || user) && <BackButton />}
        <Link
          href={user ? homeHref : '/'}
          data-tutorial="logo"
          className={`-mt-1 ml-0.5 transition-opacity duration-500 hover:brightness-75 md:-mt-0.5 md:ml-0.5 ${!isInView && 'pointer-events-none opacity-0'}`}
        >
          <DynamicLogo />
        </Link>
        <div className={`ms-auto flex place-items-center gap-2`}>
          {path.match(/\/$/) && !user && currentSettings.enableSignUp && (
            <Link
              href="/signup"
              id="signup"
              className={`btn btn-outline btn-sm md:btn-md btn-warning no-animation gap-0.5 rounded-md text-xs uppercase transition-opacity duration-500 md:text-lg md:tracking-widest ${!isInView && 'pointer-events-none opacity-0'}`}
            >
              <FormattedMessage id="auth.signup" defaultMessage="Sign up now" />
            </Link>
          )}
          {user ? (
            !path.match(/^\/(help\/?(.*)?|\/?$|signup\/?|signin\/?)/) ? (
              <div className="-mt-1 max-sm:hidden">
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
                className="btn btn-sm text- md:btn-md btn-primary mr-2 gap-0.5 rounded-md text-xs uppercase md:text-lg md:tracking-widest print:hidden"
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
