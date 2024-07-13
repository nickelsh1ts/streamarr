import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Help Centre',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const DownloadPlex = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/download-plex"
        homeElement={'Help Centre'}
        names="Getting Started,How to download the Plex&trade; app"
      />
      <div>DownloadPlex</div>
    </section>
  );
};

export default DownloadPlex;
