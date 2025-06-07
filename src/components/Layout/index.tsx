'use client';
import ImageFader from '@app/components/Common/ImageFader';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Footer from '@app/components/Layout/Footer';
import Header from '@app/components/Layout/Header';
import MobileMenu from '@app/components/Layout/MobileMenu';
import useBackdrops from '@app/hooks/useBackdrops';
import { verifySession } from '@app/lib/dal';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const Layout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const pathname = usePathname();
  const [data, setData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await verifySession();
        if (!response) {
          throw new Error('Failed to fetch');
        }
        const result = response;
        setData(result.isAuthed);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    <LoadingEllipsis />;
  }

  if (error) {
    console.log(error);
  }
  const backdrops = useBackdrops();
  const isAuthed = data;
  return (
    <main className="flex flex-col relative h-full min-h-full min-w-0">
      <Header />
      {isAuthed && <MobileMenu />}
      {pathname.match(/^\/(signin|signup)\/?/) && (
        <div className="fixed top-0 bottom-0 left-0 right-0">
          {backdrops ? (
            <ImageFader
              rotationSpeed={6000}
              backgroundImages={
                backdrops?.map(
                  (backdrop) =>
                    `https://image.tmdb.org/t/p/original${backdrop.url}`
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
      )}
      <div
        className={`${isAuthed && !pathname.match(/^(\/|\/signin|\/signup|\/help\/?(.*)?)$/) && 'lg:ms-56'} relative`}
      >
        <div
          className={`${pathname.match(/^\/(signin|signup)\/?/) ? 'min-h-[calc(100dvh-4rem)]' : 'min-h-[calc(100dvh-7.7rem)] sm:min-h-[calc(100dvh-4rem)]'} flex flex-col flex-grow relative`}
        >
          {children}
        </div>
        {pathname.match(/^\/(signin|signup)\/?/) && <Footer />}
      </div>
    </main>
  );
};
export default Layout;
