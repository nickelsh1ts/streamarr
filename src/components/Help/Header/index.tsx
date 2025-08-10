'use client';
import ImageFader from '@app/components/Common/ImageFader';
import Header from '@app/components/Layout/Header';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const HelpHeader = () => {
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <>
      <Header />
      <div id="top" className="flex shadow-sm relative">
        <ImageFader
          rotationSpeed={6000}
          gradient="bg-gradient-to-t from-brand-dark/90 to-brand-light/70"
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
            ) ?? ['/img/people-cinema-watching.jpg']
          }
        />
        <div className="container max-w-screen-xl mx-auto h-44 content-center z-0">
          <h2 className="text-center font-extrabold text-3xl my-4">
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
