'use client';
import ImageFader from '@app/components/Common/ImageFader';
import useSettings from '@app/hooks/useSettings';
import { FormattedMessage } from 'react-intl';
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
      <div className="relative container mx-auto max-w-screen-lg py-14">
        <p className="mx-7 text-center text-3xl font-extrabold text-white md:mx-14 md:text-5xl">
          <FormattedMessage
            id="help.devices.headerTitle"
            defaultMessage="Connect to {appTitle} using your favourite devices."
            values={{
              appTitle: (
                <span className="text-primary">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
};
export default Header;
