'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';
import useSettings from '@app/hooks/useSettings';
import { useIntl } from 'react-intl';

const WatchingStreamarr = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  const RelatedArticles = [
    {
      href: 'watching-streamarr/watch-on-tv',
      text: intl.formatMessage(
        {
          id: 'help.watching.watchOnTv',
          defaultMessage: 'Watching {appTitle} on your TV',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'watching-streamarr/download-offline',
      text: intl.formatMessage({
        id: 'help.watching.downloadOffline',
        defaultMessage: 'Downloading media to watch offline',
      }),
    },
    {
      href: 'watching-streamarr/reporting-issues',
      text: intl.formatMessage(
        {
          id: 'help.watching.reportingIssues',
          defaultMessage: 'Reporting an issue with {appTitle} content',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'watching-streamarr/devices',
      text: intl.formatMessage(
        {
          id: 'help.watching.devices',
          defaultMessage: 'Supported devices for watching {appTitle}',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    ...(currentSettings.seerrEnabled
      ? [
          {
            href: 'watching-streamarr/requesting',
            text: intl.formatMessage({
              id: 'help.watching.requesting',
              defaultMessage: 'Requesting new media with Seerr',
            }),
          },
        ]
      : []),
    {
      href: 'watching-streamarr/plex-web',
      text: intl.formatMessage(
        {
          id: 'help.watching.plexWeb',
          defaultMessage: 'Watching {appTitle} on the web',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'watching-streamarr/calendar',
      text: intl.formatMessage({
        id: 'help.watching.calendar',
        defaultMessage: 'Calendar & release schedule',
      }),
    },
    ...(currentSettings.enableSignUp
      ? [
          {
            href: 'watching-streamarr/invite-a-friend',
            text: intl.formatMessage(
              {
                id: 'help.watching.inviteAFriend',
                defaultMessage: 'Inviting your friends to {appTitle}',
              },
              { appTitle: currentSettings.applicationTitle }
            ),
          },
        ]
      : []),
  ];

  return (
    <section className="bg-zinc-100 text-black py-5">
      <Breadcrumbs
        paths="/watching-streamarr"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={intl.formatMessage(
          {
            id: 'help.watching.breadcrumb',
            defaultMessage: 'Watching {appTitle}',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        print={false}
      />
      <TopicsPage
        heading={intl.formatMessage(
          {
            id: 'help.watching.heading',
            defaultMessage: 'Topics related to using and watching {appTitle}',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        subheading={intl.formatMessage(
          {
            id: 'help.watching.subheading',
            defaultMessage:
              'If you have questions or are unsure of how to use {appTitle} or make new requests, you can read through these topics.',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        links={RelatedArticles}
      />
    </section>
  );
};

export default WatchingStreamarr;
