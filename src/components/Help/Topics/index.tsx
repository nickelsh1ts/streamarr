'use client';
import useSettings from '@app/hooks/useSettings';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import useSWR from 'swr';
import { useUser } from '@app/hooks/useUser';
import type { ReactNode } from 'react';

const Topics = () => {
  const { currentSettings } = useSettings();
  const { user } = useUser();
  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

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

  const quickLinks = [
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.resetPlexPassword"
          defaultMessage="Reset Plex Password"
        />
      ),
      onClick: () =>
        openPopup({ title: 'Plex Password Reset', w: 600, h: 700 }),
      hidden: false,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.resetLocalPassword"
          defaultMessage="Reset Local Password"
        />
      ),
      href: '/resetpassword',
      hidden: !currentSettings.localLogin,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.stats"
          defaultMessage="Watch history"
        />
      ),
      href: '/stats',
      hidden: !userSettings?.tautulliEnabled,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.calendar"
          defaultMessage="Release schedule"
        />
      ),
      href: '/schedule',
      hidden: !userSettings?.releaseSched,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.request"
          defaultMessage="Request new media"
        />
      ),
      href: '/request',
      hidden: !currentSettings.seerrEnabled,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.inviteAFriend"
          defaultMessage="Invite a friend"
        />
      ),
      href: '/invites',
      hidden: !currentSettings.enableSignUp,
    },
    {
      label: (
        <FormattedMessage
          id="help.quickLinks.visitPlex"
          defaultMessage="Visit {plex}.tv"
          values={{
            plex: <PlexLogo className="inline-block size-9" />,
          }}
        />
      ),
      href: 'https://www.plex.tv',
      hidden: false,
    },
  ];

  const topicSections: {
    heading: ReactNode;
    href?: string;
    links: { href: string; label: ReactNode; hidden?: boolean }[];
  }[] = [
    {
      heading: (
        <FormattedMessage
          id="help.topics.gettingStarted"
          defaultMessage="Getting Started"
        />
      ),
      href: '/help/getting-started',
      links: [
        {
          href: '/help/getting-started/what-is-streamarr',
          label: (
            <FormattedMessage
              id="help.topics.whatIsStreamarr"
              defaultMessage="What is {appTitle}?"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          ),
        },
        {
          href: '/help/getting-started/what-is-plex',
          label: (
            <>
              <FormattedMessage
                id="help.topics.whatIsPlex"
                defaultMessage="What is {plex}?"
                values={{
                  plex: <PlexLogo className="inline-block size-9" />,
                }}
              />
            </>
          ),
        },
        {
          href: '/help/getting-started/become-a-member',
          label: (
            <FormattedMessage
              id="help.topics.becomeMember"
              defaultMessage="How to become a member"
            />
          ),
        },
        {
          href: '/help/getting-started/download-plex',
          label: (
            <FormattedMessage
              id="help.topics.downloadPlex"
              defaultMessage="How to download the {plex} app"
              values={{
                plex: <PlexLogo className="inline-block size-9" />,
              }}
            />
          ),
        },
        {
          href: '/help/getting-started/download-streamarr',
          label: (
            <FormattedMessage
              id="help.topics.downloadStreamarr"
              defaultMessage="How to download the {appTitle} app"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          ),
        },
        {
          href: '/help/getting-started/quick-start',
          label: (
            <FormattedMessage
              id="help.topics.quickStart"
              defaultMessage="Quick start guide"
            />
          ),
        },
      ],
    },
    {
      heading: (
        <FormattedMessage
          id="help.manageAccount"
          defaultMessage="Manage Account"
        />
      ),
      href: '/help/manage-account',
      links: [
        {
          href: '/help/manage-account/account-settings',
          label: (
            <FormattedMessage
              id="help.topics.accountSettings"
              defaultMessage="Account settings & preferences"
            />
          ),
        },
        {
          href: '/help/manage-account/password-reset',
          label: (
            <FormattedMessage
              id="help.topics.passwordReset"
              defaultMessage="Password & security"
            />
          ),
        },
        {
          href: '/watch/web/index.html#!/settings/account',
          label: (
            <FormattedMessage
              id="help.topics.plexAccountPrefs"
              defaultMessage="Manage {plexLogo} account preferences"
              values={{
                plexLogo: <PlexLogo className="inline-block size-9" />,
              }}
            />
          ),
        },
        {
          href: '/watch/web/index.html#!/settings/web/general',
          label: (
            <FormattedMessage
              id="help.topics.plexWebPrefs"
              defaultMessage="Manage {plexLogo} web preferences"
              values={{
                plexLogo: <PlexLogo className="inline-block size-9" />,
              }}
            />
          ),
        },
        {
          href: '/watch/web/index.html#!/settings/online-media-sources',
          label: (
            <FormattedMessage
              id="help.topics.onlineMedia"
              defaultMessage="Online media sources"
            />
          ),
        },
        {
          href: '/help/manage-account/notifications',
          label: (
            <FormattedMessage
              id="help.topics.notifications"
              defaultMessage="Managing Your notifications"
            />
          ),
        },
      ],
    },
    {
      heading: (
        <FormattedMessage
          id="help.topics.watchingStreamarr"
          defaultMessage="Watching {appTitle}"
          values={{
            appTitle: (
              <span className="text-primary">
                {currentSettings.applicationTitle}
              </span>
            ),
          }}
        />
      ),
      href: '/help/watching-streamarr',
      links: [
        {
          href: '/help/watching-streamarr/watch-on-tv',
          label: (
            <FormattedMessage
              id="help.topics.watchOnTv"
              defaultMessage="Watching {appTitle} on your TV"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          ),
        },
        {
          href: '/help/watching-streamarr/download-offline',
          label: (
            <FormattedMessage
              id="help.topics.downloadOffline"
              defaultMessage="Downloading media to watch offline"
            />
          ),
        },
        {
          href: '/help/watching-streamarr/reporting-issues',
          label: (
            <FormattedMessage
              id="help.topics.reportingIssues"
              defaultMessage="Reporting an issue"
            />
          ),
        },
        {
          href: '/help/watching-streamarr/devices',
          label: (
            <FormattedMessage
              id="help.topics.devices"
              defaultMessage="Supported devices"
            />
          ),
        },
        {
          href: '/help/watching-streamarr/requesting',
          label: (
            <FormattedMessage
              id="help.topics.requesting"
              defaultMessage="Requesting new media"
            />
          ),
          hidden: !currentSettings.seerrEnabled,
        },
        {
          href: '/help/watching-streamarr/plex-web',
          label: (
            <FormattedMessage
              id="help.topics.plexWeb"
              defaultMessage="Watching {appTitle} on the web"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          ),
        },
        {
          href: '/help/watching-streamarr/calendar',
          label: (
            <FormattedMessage
              id="help.topics.calendar"
              defaultMessage="Calendar & release schedule"
            />
          ),
        },
        {
          href: '/help/watching-streamarr/invite-a-friend',
          label: (
            <FormattedMessage
              id="help.topics.inviteAFriend"
              defaultMessage="Inviting your friends to {appTitle}"
              values={{
                appTitle: (
                  <span className="text-primary">
                    {currentSettings.applicationTitle}
                  </span>
                ),
              }}
            />
          ),
          hidden: !currentSettings.enableSignUp,
        },
      ],
    },
  ];

  return (
    <div className="pb-10 px-5">
      <div className="container max-w-screen-xl mx-auto py-7">
        <div className="grid grid-flow-row grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          {topicSections.map((section, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-4">
              {section.href ? (
                <Link
                  href={section.href}
                  className="font-extrabold text-xl hover:text-neutral w-fit"
                >
                  {section.heading}
                </Link>
              ) : (
                <p className="font-extrabold text-xl">{section.heading}</p>
              )}
              {section.links
                .filter((link) => !link.hidden)
                .map((link, lIdx) => (
                  <Link
                    key={lIdx}
                    href={link.href}
                    className="hover:text-neutral w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          ))}
          <div className="flex flex-col gap-4">
            <p className="font-extrabold text-xl">
              <FormattedMessage
                id="help.quickLinks"
                defaultMessage="Quick Links"
              />
            </p>
            {quickLinks
              .filter((link) => !link.hidden)
              .map((link, idx) =>
                !link.href ? (
                  <button
                    key={idx}
                    onClick={() => link.onClick && link.onClick()}
                    className="hover:text-neutral text-start group"
                  >
                    {link.label}
                    <ArrowLongRightIcon className="link-accent w-6 float-end -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ) : (
                  <Link
                    key={idx}
                    target={link.href?.startsWith('http') ? '_blank' : '_self'}
                    rel={
                      link.href?.startsWith('http') ? 'noreferrer' : undefined
                    }
                    className="hover:text-neutral text-start group"
                    href={link.href ? link.href : ''}
                  >
                    {link.label}
                    <ArrowLongRightIcon
                      className={`${link.href?.startsWith('http') ? 'link-accent' : 'link-primary'} w-6 float-end -translate-x-2 group-hover:translate-x-0`}
                    />
                  </Link>
                )
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topics;
