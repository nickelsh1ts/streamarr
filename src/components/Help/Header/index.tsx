'use client';
import ImageFader from '@app/components/Common/ImageFader';
import Header from '@app/components/Layout/Header';
import useBackdrops from '@app/hooks/useBackdrops';

const HelpHeader = () => {
  const backdrops = useBackdrops();

  return (
    <>
      <Header />
      <div id="top" className="flex shadow-sm relative">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
            ) ?? []
          }
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
        />
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
