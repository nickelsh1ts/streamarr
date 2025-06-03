'use client';
import ImageFader from '@app/components/Common/ImageFader';
import useBackdrops from '@app/hooks/useBackdrops';

const Header = () => {
  const backdrops = useBackdrops();
  return (
    <div className="relative mt-4">
      <div className="-z-10">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
            ) ?? []
          }
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
        />
      </div>
      <div className="container max-w-screen-lg mx-auto py-14 relative">
        <p className="text-3xl mx-7 md:text-5xl  md:mx-14 font-extrabold text-center text-white">
          Connect to <span className="text-primary">Streamarr</span> using your
          favourite devices.
        </p>
      </div>
    </div>
  );
};
export default Header;
