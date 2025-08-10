'use client';
import useSettings from '@app/hooks/useSettings';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';
import PlexLogo from '@app/assets/services/plex.svg';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

const Topics = () => {
  function openPopup({
    title,
    w,
    h,
  }: {
    title: string;
    w: number;
    h: number;
  }): Window | void {
    if (!window) {
      throw new Error(
        'Window is undefined. Are you running this in the browser?'
      );
    }
    // Fixes dual-screen position
    const dualScreenLeft =
      window.screenLeft != undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop != undefined ? window.screenTop : window.screenY;
    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;
    const left = width / 2 - w / 2 + dualScreenLeft;
    const top = height / 2 - h / 2 + dualScreenTop;

    const newWindow = window.open(
      'https://app.plex.tv/auth#?resetPassword',
      title,
      'scrollbars=yes, width=' +
        w +
        ', height=' +
        h +
        ', top=' +
        top +
        ', left=' +
        left
    );

    if (newWindow) {
      newWindow.focus();
      return this;
    }
  }

  const { currentSettings } = useSettings();

  return (
    <div className="bg-zinc-100 text-black pb-10 px-5">
      <div className="container max-w-screen-xl mx-auto py-7">
        <div className="grid grid-flow-row grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <Link
              href="/help/getting-started"
              className="font-extrabold text-xl hover:text-neutral-600 w-fit"
            >
              Getting Started
            </Link>
            <Link
              href="/help/getting-started/what-is-streamarr"
              className="hover:text-neutral-600 w-fit"
            >
              What is{' '}
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>
              ?
            </Link>
            <Link
              href="/help/getting-started/what-is-plex"
              className="hover:text-neutral-600 w-fit"
            >
              What is <PlexLogo className="inline-block size-9" />?
            </Link>
            <Link
              href="/help/getting-started/download-plex"
              className="hover:text-neutral-600 w-fit"
            >
              How to download the <PlexLogo className="inline-block size-9" />{' '}
              app
            </Link>
            <Link
              href="/help/getting-started/download-streamarr"
              className="hover:text-neutral-600 w-fit"
            >
              How to download the{' '}
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>{' '}
              app
            </Link>
            <Link
              href="/help/getting-started/quick-start"
              className="hover:text-neutral-600 w-fit"
            >
              Quick Start Guide
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-extrabold text-xl">
              <FormattedMessage
                id="help.manageAccount"
                defaultMessage="Manage Account"
              />
            </p>
            <Link
              href="/watch/web/index.html#!/settings/account"
              className="hover:text-neutral-600 w-fit"
            >
              Manage account preferences
            </Link>
            <Link
              href="/watch/web/index.html#!/settings/web/general"
              className="hover:text-neutral-600 w-fit"
            >
              Manage web preferences
            </Link>
            <Link
              href="/watch/web/index.html#!/settings/online-media-sources"
              className="hover:text-neutral-600 w-fit"
            >
              Turn on/off non-
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>{' '}
              content
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <Link
              href="/help/watching-streamarr"
              className="font-extrabold text-xl hover:text-neutral-600 w-fit"
            >
              Watching{' '}
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>
            </Link>
            <Link
              href="/help/watching-streamarr/watch-on-tv"
              className="hover:text-neutral-600 w-fit"
            >
              Watching{' '}
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>{' '}
              on your TV
            </Link>
            <Link
              href="/help/watching-streamarr/download-offline"
              className="hover:text-neutral-600 w-fit"
            >
              Downloading media to watch offline
            </Link>
            <Link
              href="/help/watching-streamarr/reporting-issues"
              className="hover:text-neutral-600 w-fit"
            >
              Reporting an issue
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-extrabold text-xl">
              <FormattedMessage
                id="help.quickLinks"
                defaultMessage="Quick Links"
              />
            </p>
            <button
              onClick={() => {
                openPopup({ title: 'Plex Password Reset', w: 600, h: 700 });
              }}
              className="hover:text-neutral-600 text-start"
            >
              Reset Password
              <ArrowLongRightIcon className="link-error w-6 float-end" />
            </button>
            <Link className="hover:text-neutral-600" href="/request">
              Request TV Shows or movies{' '}
              <ArrowLongRightIcon className="link-error w-6 float-end" />
            </Link>
            <Link
              target="_blank"
              className="hover:text-neutral-600"
              href="https://www.plex.tv"
              rel="noreferrer"
            >
              Visit <PlexLogo className="inline-block size-9" />
              .tv <ArrowLongRightIcon className="link-error w-6 float-end" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topics;
