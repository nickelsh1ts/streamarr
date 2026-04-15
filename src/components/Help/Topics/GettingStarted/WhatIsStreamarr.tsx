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
      <div className="mt-5 font-extrabold" id="overview">
        <FormattedMessage
          id="help.whatIsStreamarr.overviewTitle"
          defaultMessage="Overview"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.whatIsStreamarr.description1"
          defaultMessage="{appTitle} is a free, private, members-only streaming service powered by {plexLogo}. It brings together a curated library of movies, TV shows, and music — all available to stream from anywhere, on almost any device."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plexLogo: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <p className="mb-4">
        <FormattedMessage
          id="help.whatIsStreamarr.description2"
          defaultMessage="If something isn't already in the library, members can request new content directly through the built-in request system. {appTitle} is designed to be seamless and easy to use — no technical skills required."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      </p>
      <div className="mt-5 font-extrabold" id="about-streamarr">
        <FormattedMessage
          id="help.whatIsStreamarr.aboutTitle"
          defaultMessage="About Streamarr"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.whatIsStreamarr.aboutDesc"
          defaultMessage="{appTitle} is built using {streamarr}, an open-source media server management platform. Streamarr provides the tools to manage members, invites, content requests, and more — all wrapped in a modern, user-friendly interface."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            streamarr: (
              <Link
                href="https://streamarr.dev"
                target="_blank"
                rel="noreferrer"
                className="link-primary font-bold"
              >
                Streamarr
              </Link>
            ),
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <Link
            href="https://streamarr.dev"
            target="_blank"
            rel="noreferrer"
            className="link-primary font-bold"
          >
            streamarr.dev
          </Link>{' '}
          —{' '}
          <FormattedMessage
            id="help.whatIsStreamarr.websiteDesc"
            defaultMessage="Official website and documentation"
          />
        </li>
        <li>
          <Link
            href="https://github.com/nickelsh1ts/streamarr"
            target="_blank"
            rel="noreferrer"
            className="link-primary font-bold"
          >
            GitHub
          </Link>{' '}
          —{' '}
          <FormattedMessage
            id="help.whatIsStreamarr.githubDesc"
            defaultMessage="Source code and issue tracker"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="features">
        <FormattedMessage
          id="help.whatIsStreamarr.featuresTitle"
          defaultMessage="Key Features"
        />
      </div>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featureStreaming"
            defaultMessage="Stream movies, TV shows, and music on-demand from any supported device"
          />
        </li>
        {currentSettings.seerrEnabled && (
          <li>
            <FormattedMessage
              id="help.whatIsStreamarr.featureRequests"
              defaultMessage="Request new content through Seerr — if it's not in the library, just ask for it"
            />
          </li>
        )}
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featureDevices"
            defaultMessage="Watch on Smart TVs, phones, tablets, computers, streaming sticks, and more"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featureNotifications"
            defaultMessage="Get notified when new content becomes available or when your requests are fulfilled"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featureCalendar"
            defaultMessage="Browse upcoming releases and track when new episodes or movies are arriving"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featureDownload"
            defaultMessage="Download content for offline viewing via the {plexLogo} app"
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.whatIsStreamarr.featurePWA"
            defaultMessage="Install {appTitle} as a web app on your device for quick access"
            values={{
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="getting-started">
        <FormattedMessage
          id="help.whatIsStreamarr.getStartedTitle"
          defaultMessage="Getting Started"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.whatIsStreamarr.getStartedDesc"
          defaultMessage="Ready to dive in? Here are some helpful resources to get you going:"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <Link
            href="/help/getting-started/become-a-member"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.whatIsStreamarr.linkBecomeMember"
              defaultMessage="How to become a member"
            />
          </Link>
        </li>
        <li>
          <Link
            href="/help/getting-started/quick-start"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.whatIsStreamarr.linkQuickStart"
              defaultMessage="Quick Start Guide"
            />
          </Link>
        </li>
        <li>
          <Link
            href="/help/getting-started/download-streamarr"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.whatIsStreamarr.linkDownload"
              defaultMessage="Download the {appTitle} app"
              values={{
                appTitle: (
                  <span className="text-primary font-bold">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          </Link>
        </li>
        <li>
          <Link
            href="/help/getting-started/what-is-plex"
            className="link-primary font-bold"
          >
            <FormattedMessage
              id="help.whatIsStreamarr.linkWhatIsPlex"
              defaultMessage="What is Plex?"
            />
          </Link>
        </li>
      </ul>
    </>
  );
};

const anchors = [
  { href: '#overview', title: 'Overview' },
  { href: '#about-streamarr', title: 'About Streamarr' },
  { href: '#features', title: 'Key Features' },
  { href: '#getting-started', title: 'Getting Started' },
];

const WhatIsStreamarr = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-streamarr"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage(
          {
            id: 'help.whatIsStreamarr.breadcrumb',
            defaultMessage: 'What is {appTitle}?',
          },
          {
            appTitle: currentSettings.applicationTitle,
          }
        )}`}
      />
      <HelpCard
        heading={intl.formatMessage(
          {
            id: 'help.whatIsStreamarr.heading',
            defaultMessage: 'What is {appTitle}?',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        subheading={intl.formatMessage(
          {
            id: 'help.whatIsStreamarr.subheading',
            defaultMessage:
              'Been wondering to yourself, "what the heck is {appTitle}"? Look no further...',
          },
          {
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
          }
        )}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default WhatIsStreamarr;
