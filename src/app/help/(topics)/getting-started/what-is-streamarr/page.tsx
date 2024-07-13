import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import type { Metadata } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Help Centre',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const WhatIsStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-streamarr"
        homeElement={'Help Centre'}
        names="Getting Started,What is Streamarr?"
      />
      <div>WhatIsStreamarr</div>
    </section>
  );
};

export default WhatIsStreamarr;
