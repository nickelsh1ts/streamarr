'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <p className="mb-4">
        <FormattedMessage
          id="help.whatIsPlex.description1"
          defaultMessage="A one-stop destination to stream movies, TV shows, and music, {plexLogo} is the most comprehensive entertainment platform available today. Available on almost any device, {plexLogo2} is the first-and-only streaming platform to offer free ad-supported movies, shows, and live TV together with the ability to easily search—and add to your Watchlist—any title ever made, no matter which streaming service it lives on. Using the platform as their entertainment concierge, 17 million (and growing!) monthly active users count on {plexLogo3} for new discoveries and recommendations from all their favorite streaming apps, personal media libraries, and beyond."
          values={{
            plexLogo: <PlexLogo className="inline-block size-9" />,
            plexLogo2: <PlexLogo className="inline-block size-9" />,
            plexLogo3: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <p className="mb-4">
        <FormattedMessage
          id="help.whatIsPlex.description2"
          defaultMessage="If you are streaming only third-party content ({appTitle}, live TV, web shows), then you are good to go as soon as you have an account, just install an app on your phone, Smart TV, computer, or simply open up our web app on your browser!"
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <p className="mb-4">
        <FormattedMessage
          id="help.whatIsPlex.description3"
          defaultMessage="Watch thousands of free, on-demand Movies & Shows streaming service or over 100 channels of live TV. Listen to your favorite podcasts at home or on your commute. Watch your favorite web shows from talented creators around the world. You can even access over 60 million streaming music tracks and videos, provided by TIDAL!"
        />
      </p>
      <p className="my-6">
        <FormattedMessage
          id="help.whatIsPlex.moreInfo"
          defaultMessage="Find more feature information {link}"
          values={{
            link: (
              <Link
                className="link-accent underline font-bold"
                target="_blank"
                href={'https://plex.tv/'}
              >
                <FormattedMessage
                  id="help.whatIsPlex.onOurWebsite"
                  defaultMessage="on our website."
                />
              </Link>
            ),
          }}
        />
      </p>
    </>
  );
};

const Heading = () => {
  return (
    <>
      <FormattedMessage
        id="help.whatIsPlex.heading"
        defaultMessage="What is {plexLogo}?"
        values={{
          plexLogo: <PlexLogo className="inline-block size-9" />,
        }}
      />
    </>
  );
};

const SubHeading = () => {
  return (
    <>
      <FormattedMessage
        id="help.whatIsPlex.subheading"
        defaultMessage="{plexLogo} gives you one place to find and access all the media that matters to you. From personal media on your own server, to free and on-demand Movies & Shows, live TV, podcasts, and web shows, to streaming music, you can enjoy it all in one app, on any device."
        values={{
          plexLogo: <PlexLogo className="inline-block size-9" />,
        }}
      />
    </>
  );
};

const WhatIsPlex = () => {
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-plex"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage({ id: 'help.whatIsPlex.breadcrumb', defaultMessage: 'What is Plex?' })}`}
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
