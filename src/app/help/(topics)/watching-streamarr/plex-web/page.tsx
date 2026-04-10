'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import PlexLogo from '@app/assets/services/plex_dark.svg';
import { FormattedMessage, useIntl } from 'react-intl';

const HelpContent = () => {
  const { currentSettings } = useSettings();

  return (
    <>
      <div className="mt-5 font-extrabold" id="browsing">
        <FormattedMessage
          id="help.plexWeb.browsingTitle"
          defaultMessage="Browsing Content"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.plexWeb.browsingDesc"
          defaultMessage="You can browse all available content directly from {appTitle} using the built-in {plex} Web player. This is the same experience as visiting {plex} directly, but integrated into {appTitle} for convenience."
          values={{
            appTitle: (
              <span className="text-primary font-bold">
                {currentSettings.applicationTitle}
              </span>
            ),
            plex: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.plexWeb.browseLibrary"
            defaultMessage="Browse your full library of movies, TV shows, and music"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.plexWeb.searchTitles"
            defaultMessage="Use the search bar to find specific titles"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.plexWeb.browseGenre"
            defaultMessage="Browse by genre, collection, or recently added content"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.plexWeb.watchlist"
            defaultMessage="Access your watchlist and continue watching"
          />
        </li>
      </ul>
      <div className="mt-5 font-extrabold" id="playback">
        <FormattedMessage
          id="help.plexWeb.playbackTitle"
          defaultMessage="Playing Content"
        />
      </div>
      <p className="my-4">
        <FormattedMessage
          id="help.plexWeb.playbackDesc"
          defaultMessage="Select any title to view its details, then click play to start streaming. The {plex} web player supports playback directly in your browser without needing any additional apps."
          values={{
            plex: <PlexLogo className="inline-block size-9" />,
          }}
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.plexWeb.autoQuality"
            defaultMessage="Playback quality automatically adjusts to your internet connection"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.plexWeb.manualQuality"
            defaultMessage="You can manually adjust quality settings from the player controls"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.plexWeb.subtitles"
            defaultMessage="Subtitles and audio tracks can be changed during playback"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4">
        <span className="text-info font-bold">
          <FormattedMessage id="help.common.tip" defaultMessage="Tip" />
        </span>
        :{' '}
        <FormattedMessage
          id="help.plexWeb.browserTip"
          defaultMessage="For the best playback experience, use a modern browser such as Chrome, Firefox, Edge, or Safari. A stable internet connection of at least 3 Mbps is recommended for HD content."
        />
      </p>
    </>
  );
};

const anchors = [
  { href: '#browsing', title: 'Browsing Content' },
  { href: '#playback', title: 'Playing Content' },
];

const PlexWeb = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/plex-web"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.plexWeb.breadcrumb', defaultMessage: 'Watching on the Web' })}`}
      />
      <HelpCard
        heading={intl.formatMessage(
          {
            id: 'help.plexWeb.heading',
            defaultMessage: 'Watching {appTitle} on the web',
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
            id: 'help.plexWeb.subheading',
            defaultMessage:
              'Browse and stream your entire {appTitle} library directly from your browser using the built-in Plex Web player.',
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

export default PlexWeb;
