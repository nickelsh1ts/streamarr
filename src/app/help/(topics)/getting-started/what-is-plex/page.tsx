import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import Link from 'next/link';

const HelpContent = () => {
  return (
    <>
      <p className="mb-4">
        A one-stop destination to stream movies, TV shows, and music, Ple
        <span className="text-accent">x</span>&trade; is the most comprehensive
        entertainment platform available today. Available on almost any device,
        Ple<span className="text-accent">x</span>&trade; is the first-and-only
        streaming platform to offer free ad-supported movies, shows, and live TV
        together with the ability to easily search—and add to your Watchlist—any
        title ever made, no matter which streaming service it lives on. Using
        the platform as their entertainment concierge, 17 million (and growing!)
        monthly active users count on Ple<span className="text-accent">x</span>
        &trade; for new discoveries and recommendations from all their favorite
        streaming apps, personal media libraries, and beyond.
      </p>
      <p className="mb-4">
        If you are streaming only third-party content (
        <span className="text-primary font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </span>
        , live TV, web shows), then you are good to go as soon as you have an
        account, just install an app on your phone, Smart TV, computer, or
        simply open up our web app on your browser!
      </p>
      <p className="mb-4">
        Watch thousands of free, on-demand Movies & Shows streaming service or
        over 100 channels of live TV. Listen to your favorite podcasts at home
        or on your commute. Watch your favorite web shows from talented creators
        around the world. You can even access over 60 million streaming music
        tracks and videos, provided by TIDAL!
      </p>
      <p className="my-6">
        Find more feature information{' '}
        <Link
          className="link-accent underline font-bold"
          target="_blank"
          href={'https://plex.tv/'}
        >
          on our website.
        </Link>
      </p>
    </>
  );
};

const Heading = () => {
  return (
    <>
      What is Ple<span className="text-accent">x</span>&trade;?
    </>
  );
};

const SubHeading = () => {
  return (
    <>
      Ple<span className="text-accent">x</span>&trade; gives you one place to
      find and access all the media that matters to you. From personal media on
      your own server, to free and on-demand Movies & Shows, live TV, podcasts,
      and web shows, to streaming music, you can enjoy it all in one app, on any
      device.
    </>
  );
};

const WhatIsPlex = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-plex"
        homeElement={'Help Centre'}
        names="Getting Started,What is Plex&trade;?"
      />
      <HelpCard
        heading={<Heading />}
        subheading={<SubHeading />}
        content={<HelpContent />}
      />
    </section>
  );
};

export default WhatIsPlex;
