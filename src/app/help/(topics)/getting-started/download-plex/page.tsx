'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const Heading = () => {
  return (
    <>
      <FormattedMessage
        id="help.downloadPlex.heading"
        defaultMessage="How to download the {plexLogo} app"
        values={{ plexLogo: <PlexLogo className="inline-block size-9" /> }}
      />
    </>
  );
};

const SubHeading = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <FormattedMessage
        id="help.downloadPlex.subheading"
        defaultMessage="Although the {plexLogo} app is not required to use {appTitle}, on certain devices such as smart TVs or game systems it may offer a better experience. Some smart TVs and media devices will come with the {plexLogo2} app already installed, or easily installable via their built in app stores."
        values={{
          plexLogo: <PlexLogo className="inline-block size-9" />,
          plexLogo2: <PlexLogo className="inline-block size-9" />,
          appTitle: (
            <span className="text-primary font-bold">
              {currentSettings.applicationTitle}
            </span>
          ),
        }}
      />
    </>
  );
};

const anchors = [{ href: '#downloadplex', title: 'Downloading Plex' }];

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="downloadplex">
        <FormattedMessage
          id="help.downloadPlex.downloadTitle"
          defaultMessage="Downloading the {plexLogo} app"
          values={{ plexLogo: <PlexLogo className="inline-block size-9" /> }}
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadPlex.step1"
            defaultMessage="Head on over to {link} and choose your preferred device"
            values={{
              link: (
                <Link
                  target="_blank"
                  href={'https://www.plex.tv/media-server-downloads/#plex-app'}
                  className="link-accent underline"
                >
                  <FormattedMessage
                    id="help.downloadPlex.linkText"
                    defaultMessage="this page here"
                  />
                </Link>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadPlex.step2"
            defaultMessage="If there is a download link available, select it and follow the prompts"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadPlex.step3"
            defaultMessage="If there is no download, follow the instructions provided to locate and install the app on the desired platform"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.downloadPlex.notRequired"
            defaultMessage="Downloading the {plexLogo} app is not required to stream content directly from {appTitle}."
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
              appTitle: (
                <span className="text-primary font-bold">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.downloadPlex.offlineRequired"
            defaultMessage="Downloading content to watch offline, such as when on an airplane, the {plexLogo} app is required."
            values={{
              plexLogo: <PlexLogo className="inline-block size-9" />,
            }}
          />
        </li>
      </ul>
      <p>
        <FormattedMessage
          id="help.downloadPlex.downloadStreamarr"
          defaultMessage="If you wish instead to download the {appTitle} app, check out {link}."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            link: (
              <Link
                href={'/help/getting-started/download-streamarr'}
                className="link-primary underline"
              >
                <FormattedMessage
                  id="help.downloadPlex.thisPage"
                  defaultMessage="this page"
                />
              </Link>
            ),
          }}
        />
      </p>
    </>
  );
};

const DownloadPlex = () => {
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-plex"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.gettingStarted.breadcrumb', defaultMessage: 'Getting Started' })},${intl.formatMessage({ id: 'help.downloadPlex.breadcrumb', defaultMessage: 'How to download the Plex app' })}`}
      />
      <HelpCard
        heading={<Heading />}
        subheading={<SubHeading />}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default DownloadPlex;
