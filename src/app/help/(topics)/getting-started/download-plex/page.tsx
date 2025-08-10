'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex.svg';
import Link from 'next/link';

const Heading = () => {
  return (
    <>
      How to download the <PlexLogo className="inline-block size-9" /> app
    </>
  );
};

const SubHeading = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      Although the <PlexLogo className="inline-block size-9" /> app is not
      required to use{' '}
      <span className="text-primary font-bold">
        {currentSettings.applicationTitle}
      </span>
      , on certain devices such as smart TVs or game systems it may offer a
      better experience. Some smart TVs and media devices will come with the{' '}
      <PlexLogo className="inline-block size-9" /> app already installed, or
      easily installable via their built in app stores.
    </>
  );
};

const anchors = [{ href: '#downloadplex', title: 'Downloading Plex' }];

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="downloadplex">
        Downloading the <PlexLogo className="inline-block size-9" /> app
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          Head on over to{' '}
          <Link
            target="_blank"
            href={'https://www.plex.tv/en-ca/media-server-downloads/#plex-app'}
            className="link-accent underline"
          >
            this page here
          </Link>{' '}
          and choose your preferred device
        </li>
        <li>
          If there is a download link available, select it and follow the
          prompts
        </li>
        <li>
          If there is no download, follow the instructions provided to locate
          and install the app on the desired platform
        </li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          The <PlexLogo className="inline-block size-9" /> app on mobile devices
          requires a small one time free for local playback. This helps support
          the development work they do.
        </li>
        <li>
          If you do not wish to pay, you can continue to cast from the{' '}
          <PlexLogo className="inline-block size-9" />
          app to a supported device such as Chromecast for free.
        </li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          The <PlexLogo className="inline-block size-9" /> app on mobile devices
          requires a small one time free for local playback. This helps support
          the development work they do.
        </li>
        <li>
          If you do not wish to pay, you can continue to cast from the{' '}
          <PlexLogo className="inline-block size-9" />
          app to a supported device such as Chromecast for free.
        </li>
        <li>
          Downloading the <PlexLogo className="inline-block size-9" /> app is
          not required to stream content directly from{' '}
          <span className="text-primary font-bold">
            {currentSettings.applicationTitle}
          </span>
          .
        </li>
        <li>
          Downloading content to watch offline, such as when on an airplane, the
          <PlexLogo className="inline-block size-9" /> app is required.
        </li>
      </ul>
      <p>
        If you wish instead to download the{' '}
        <span className="text-primary font-bold">
          {currentSettings.applicationTitle}
        </span>{' '}
        app, check out{' '}
        <Link
          href={'/help/getting-started/download-streamarr'}
          className="link-primary underline"
        >
          this page
        </Link>
        .
      </p>
    </>
  );
};

const DownloadPlex = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-plex"
        homeElement={'Help Centre'}
        names="Getting Started,How to download the Plex&trade; app"
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
