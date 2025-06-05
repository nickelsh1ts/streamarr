import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TopicsPage from '@app/components/Help/TopicsPage';

const RelatedArticles = [
  {
    href: 'getting-started/become-a-member',
    text: `How to become a member of ${process.env.NEXT_PUBLIC_APP_NAME}`,
  },
  {
    href: 'getting-started/what-is-streamarr',
    text: `What is ${process.env.NEXT_PUBLIC_APP_NAME}`,
  },
  {
    href: 'getting-started/what-is-plex',
    text: 'What is Plex',
  },
  {
    href: 'getting-started/download-plex',
    text: 'How to download the Plex app',
  },
  {
    href: 'getting-started/download-streamarr',
    text: `How to download the ${process.env.NEXT_PUBLIC_APP_NAME} app`,
  },
  {
    href: 'getting-started/quick-start',
    text: `Quick start guide to getting started with ${process.env.NEXT_PUBLIC_APP_NAME}`,
  },
];

const GettingStarted = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started"
        homeElement={'Help Centre'}
        names="Getting Started"
        print={false}
      />
      <TopicsPage
        heading={`Topics related to getting started with ${process.env.NEXT_PUBLIC_APP_NAME}`}
        subheading={`If you're new to ${process.env.NEXT_PUBLIC_APP_NAME} and looking to get started and not sure where to go, you can read through these topics.`}
        links={RelatedArticles}
      />
    </section>
  );
};

export default GettingStarted;
