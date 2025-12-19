'use client';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import MobileMenu from '@app/components/Layout/MobileMenu';
import { redirect, usePathname } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import useSWR, { SWRConfig } from 'swr';
import ImageFader from '@app/components/Common/ImageFader';
import { useEffect, useMemo, useRef } from 'react';
import { publicRoutes } from '@app/proxy';
import useSettings from '@app/hooks/useSettings';
import Notifications from '@app/components/Layout/Notifications';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';

const Layout = ({
  children,
  initialized: serverInitialized,
}: {
  children: React.ReactNode;
  initialized: boolean;
}) => {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { currentSettings } = useSettings();
  const tokenRef = useRef(false);
  const { data: notificationSettings } =
    useSWR<UserSettingsNotificationsResponse>(
      user ? `/api/v1/user/${user?.id}/settings/notifications` : null
    );
  const { data: dynamicSettings } = useSWR('/api/v1/settings/public');

  const initialized =
    dynamicSettings?.initialized ??
    currentSettings.initialized ??
    serverInitialized;

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

  // Set Plex token in localStorage after successful login
  useEffect(() => {
    if (user && !loading && !tokenRef.current) {
      const setPlexToken = async () => {
        try {
          // Check if token already exists
          if (localStorage.getItem('myPlexAccessToken')) {
            tokenRef.current = true;
            return;
          }

          // Fetch user's Plex token
          const response = await axios.get('/api/v1/auth/plex/token');
          const { token } = response.data;

          if (token) {
            localStorage.setItem('myPlexAccessToken', token);
            tokenRef.current = true;
          }
        } catch {
          // Token fetch failed or user doesn't have a Plex token
          // Do not set tokenRef.current = true here; allow retry on next render
        }
      };

      setPlexToken();
    }
  }, [user, loading]);

  if (!initialized) {
    if (!pathname.match(/setup|signin\/plex\/loading/)) {
      redirect('/setup');
    }
  } else {
    // Redirect from setup to admin after completion
    if (pathname.match(/^\/setup$/) && user) {
      redirect('/admin');
    }

    // Protected routes require authentication
    if (!publicRoutes.test(pathname) && !user && !loading) {
      redirect('/signin');
    }

    // Authenticated users on signin/home go to watch
    if (pathname.match(/(signin|\/$)/) && user && !loading) {
      redirect('/watch');
    }

    // Signup disabled redirect
    if (pathname.match(/signup/) && !currentSettings.enableSignUp) {
      redirect('/signin');
    }

    // Feature-disabled redirects
    if (
      ((pathname.match(/schedule/) && !currentSettings.releaseSched) ||
        (pathname.match(/request/) && !currentSettings.enableRequest)) &&
      user &&
      !loading
    ) {
      redirect('/watch');
    }
  }

  return (
    <SWRConfig value={swrConfigValue}>
      {notificationSettings?.inAppEnabled && user && <Notifications />}
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
