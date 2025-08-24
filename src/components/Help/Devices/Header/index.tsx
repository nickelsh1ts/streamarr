'use client';
import ImageFader from '@app/components/Common/ImageFader';
import useSettings from '@app/hooks/useSettings';
import useSWR from 'swr';

const Header = () => {
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });
  const { currentSettings } = useSettings();

  return (
    <div className="relative mt-4">
      <div className="-z-10">
        <ImageFader
          rotationSpeed={6000}
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
            ) ?? ['/img/people-cinema-watching.jpg']
          }
        />
      </div>
      <div className="container max-w-screen-lg mx-auto py-14 relative">
        <p className="text-3xl mx-7 md:text-5xl  md:mx-14 font-extrabold text-center text-white">
          Connect to{' '}
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          using your favourite devices.
        </p>
      </div>
    </div>
  );
};
export default Header;
