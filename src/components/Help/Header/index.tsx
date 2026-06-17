'use client';
import ImageFader from '@app/components/Common/ImageFader';
import Header from '@app/components/Layout/Header';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import { useUser } from '@app/hooks/useUser';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const HelpHeader = () => {
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });
  const { user, loading } = useUser({ disableAutoRevalidation: true });

  return (
    <>
      <Header />
      <div id="top" className="relative flex shadow-sm">
        <ImageFader
          rotationSpeed={6000}
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
            ) ?? ['/img/people-cinema-watching.jpg']
          }
        />
        {!user && !loading && (
          <div className="absolute top-4 right-4 text-white">
            <LanguagePicker />
          </div>
        )}
        <div className="z-0 container mx-auto h-44 max-w-screen-xl content-center">
          <h2 className="my-4 text-center text-3xl font-extrabold text-white">
            <FormattedMessage
              id="help.helpCentre"
              defaultMessage="Help Centre"
            />
          </h2>
        </div>
      </div>
    </>
  );
};

export default HelpHeader;
