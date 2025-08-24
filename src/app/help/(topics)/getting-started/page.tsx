'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';
import useSettings from '@app/hooks/useSettings';

const GettingStarted = () => {
  const { currentSettings } = useSettings();
  const RelatedArticles = [
    {
      href: 'getting-started/become-a-member',
      text: `How to become a member of ${currentSettings.applicationTitle}`,
    },
    {
      href: 'getting-started/what-is-streamarr',
      text: `What is ${currentSettings.applicationTitle}`,
    },
    { href: 'getting-started/what-is-plex', text: 'What is Plex' },
    {
      href: 'getting-started/download-plex',
      text: 'How to download the Plex app',
    },
    {
      href: 'getting-started/download-streamarr',
      text: `How to download the ${currentSettings.applicationTitle} app`,
    },
    {
      href: 'getting-started/quick-start',
      text: `Quick start guide to getting started with ${currentSettings.applicationTitle}`,
    },
  ];

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started"
        homeElement={'Help Centre'}
        names="Getting Started"
        print={false}
      />
      <TopicsPage
        heading={`Topics related to getting started with ${currentSettings.applicationTitle}`}
        subheading={`If you're new to ${currentSettings.applicationTitle} and looking to get started and not sure where to go, you can read through these topics.`}
        links={RelatedArticles}
      />
    </section>
  );
};

export default GettingStarted;
