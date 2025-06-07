'use client';
import ImageFader from '@app/components/Common/ImageFader';
import Header from '@app/components/Layout/Header';
import useBackdrops from '@app/hooks/useBackdrops';
import Image from 'next/image';

const HelpHeader = () => {
  const backdrops = useBackdrops();

  return (
    <>
      <Header />
      <div id="top" className="flex shadow-sm relative">
        {backdrops ? (
          <ImageFader
            rotationSpeed={6000}
            gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
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
        <div className="container max-w-screen-xl mx-auto h-44 content-center z-0">
          <h2 className="text-center font-extrabold text-3xl my-4">
            Help Centre
          </h2>
        </div>
      </div>
    </>
  );
};

export default HelpHeader;
