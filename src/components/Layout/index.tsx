'use client';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import MobileMenu from '@app/components/Layout/MobileMenu';
import { usePathname } from 'next/navigation';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import useSWR, { SWRConfig } from 'swr';
import ImageFader from '@app/components/Common/ImageFader';
import Image from 'next/image';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const { user } = useUser();

  return (
    <SWRConfig
      value={{
        fetcher: (url) => axios.get(url).then((res) => res.data),
        fallback: {
          '/api/v1/auth/me': user,
        },
      }}
    >
      {!pathname.match(
        /\/(help\/?(.*)?|watch\/?(.*)?|signin\/plex\/loading|setup|logout|\/?$)/
      ) ? (
        <main className="flex flex-col relative h-full min-h-full min-w-0">
          <Header />
          {user && <MobileMenu />}
          {pathname.match(/^\/(signin|signup|setup)\/?/) && <FaderBackground />}
          <div
            className={`${user && !pathname.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && 'lg:ms-56'} relative`}
          >
            <div
              className={`${pathname.match(/^\/(signin|signup)\/?/) ? 'min-h-[calc(100dvh-4rem)]' : 'min-h-[calc(100dvh-7.7rem)] sm:min-h-[calc(100dvh-4rem)]'} flex flex-col flex-grow relative`}
            >
              {children}
            </div>
            {pathname.match(/^\/(signin|signup)\/?/) && <Footer />}
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
        {backdrops ? (
          <ImageFader
            rotationSpeed={6000}
            backgroundImages={
              backdrops?.map(
                (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
              ) ?? []
            }
          />
        ) : (
          <div>
            <div
              className={`absolute-top-shift absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in`}
            >
              <Image
                unoptimized
                className="absolute inset-0 h-full w-full"
                style={{ objectFit: 'cover' }}
                alt=""
                src={'/img/people-cinema-watching.jpg'}
                fill
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-dark via-brand-dark/75 via-65% lg:via-40% to-80% to-brand-dark/0`}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
