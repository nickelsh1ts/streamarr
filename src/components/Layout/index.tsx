'use client';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import MobileMenu from '@app/components/Layout/MobileMenu';
import { redirect, usePathname } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import useSWR, { SWRConfig } from 'swr';
import ImageFader from '@app/components/Common/ImageFader';
import { useMemo } from 'react';
import { publicRoutes } from '@app/middleware';
import useSettings from '@app/hooks/useSettings';

const Layout = ({
  children,
  initialized,
}: {
  children: React.ReactNode;
  initialized: boolean;
}) => {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { currentSettings } = useSettings();

  const isMainLayout = useMemo(
    () =>
      !pathname.match(
        /\/(help\/?(.*)?|watch\/?(.*)?|signin\/plex\/loading|setup|logout|\/?$)/
      ),
    [pathname]
  );
  const isAuthLayout = useMemo(
    () => pathname.match(/^\/(signin|signup|resetpassword\/?(.*)?|setup)\/?/),
    [pathname]
  );
  const isFooterLayout = useMemo(
    () => pathname.match(/^\/(signin|signup|resetpassword\/?(.*)?)\/?/),
    [pathname]
  );
  const isSidebar = useMemo(
    () =>
      user &&
      !pathname.match(
        /^(\/|\/signin|\/signup|\/resetpassword\/?(.*)?|\/help\/?(.*)?)$/
      ),
    [user, pathname]
  );
  const swrConfigValue = useMemo(
    () => ({
      fetcher: (url: string) => axios.get(url).then((res) => res.data),
      fallback: {
        '/api/v1/auth/me': user,
      },
    }),
    [user]
  );

  if (!initialized) {
    if (!pathname.match(/setup|signin\/plex\/loading/)) {
      redirect('/setup');
    }
  } else {
    if (pathname.match(/setup/)) {
      redirect('/');
    }

    if (!publicRoutes.test(pathname) && !user && !loading) {
      redirect('/signin');
    }

    if (pathname.match(/(signin|setup|\/$)/) && user && !loading) {
      redirect('/watch');
    }

    if (pathname.match(/signup/) && !currentSettings.enableSignUp) {
      redirect('/signin');
    }

    if (
      ((pathname.match(/schedule/) && !currentSettings.releaseSched) ||
        (pathname.match(/invites/) && !currentSettings.enableSignUp)) &&
      user &&
      !loading
    ) {
      redirect('/watch');
    }
  }

  return (
    <SWRConfig value={swrConfigValue}>
      {isMainLayout ? (
        <main className="flex flex-col relative h-full min-h-full min-w-0">
          <Header />
          {user && <MobileMenu />}
          {isAuthLayout && <FaderBackground />}
          <div className={`${isSidebar && 'lg:ms-56'} relative`}>
            <div
              className={`${
                isFooterLayout
                  ? 'min-h-[calc(100dvh-4rem)]'
                  : 'min-h-[calc(100dvh-7.7rem)] sm:min-h-[calc(100dvh-4rem)]'
              } flex flex-col flex-grow relative`}
            >
              {children}
            </div>
            {isFooterLayout && <Footer />}
          </div>
        </main>
      ) : (
        children
      )}
    </SWRConfig>
  );
};
export default Layout;

const FaderBackground = () => {
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <>
      <div className="fixed top-0 bottom-0 left-0 right-0">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
            ) ?? ['/img/people-cinema-watching.jpg']
          }
        />
      </div>
    </>
  );
};
