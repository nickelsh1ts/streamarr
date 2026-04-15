'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';
import useSettings from '@app/hooks/useSettings';
import { useIntl } from 'react-intl';

const GettingStarted = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const RelatedArticles = [
    {
      href: 'getting-started/what-is-streamarr',
      text: intl.formatMessage(
        {
          id: 'help.gettingStarted.whatIsStreamarr',
          defaultMessage: 'What is {appTitle}',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'getting-started/what-is-plex',
      text: intl.formatMessage({
        id: 'help.gettingStarted.whatIsPlex',
        defaultMessage: 'What is Plex',
      }),
    },
    {
      href: 'getting-started/become-a-member',
      text: intl.formatMessage(
        {
          id: 'help.gettingStarted.becomeMember',
          defaultMessage: 'How to become a member of {appTitle}',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'getting-started/download-plex',
      text: intl.formatMessage({
        id: 'help.gettingStarted.downloadPlex',
        defaultMessage: 'How to download the Plex app',
      }),
    },
    {
      href: 'getting-started/download-streamarr',
      text: intl.formatMessage(
        {
          id: 'help.gettingStarted.downloadStreamarr',
          defaultMessage: 'How to download the {appTitle} app',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
    {
      href: 'getting-started/quick-start',
      text: intl.formatMessage(
        {
          id: 'help.gettingStarted.quickStart',
          defaultMessage:
            'Quick start guide to getting started with {appTitle}',
        },
        { appTitle: currentSettings.applicationTitle }
      ),
    },
  ];

  return (
    <section className="bg-zinc-100 text-black py-5">
      <Breadcrumbs
        paths="/getting-started"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={intl.formatMessage({
          id: 'help.gettingStarted.breadcrumb',
          defaultMessage: 'Getting Started',
        })}
        print={false}
      />
      <TopicsPage
        heading={intl.formatMessage(
          {
            id: 'help.gettingStarted.heading',
            defaultMessage: 'Topics related to getting started with {appTitle}',
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        subheading={intl.formatMessage(
          {
            id: 'help.gettingStarted.subheading',
            defaultMessage:
              "If you're new to {appTitle} and looking to get started and not sure where to go, you can read through these topics.",
          },
          { appTitle: currentSettings.applicationTitle }
        )}
        links={RelatedArticles}
      />
    </section>
  );
};

export default GettingStarted;
