import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const WhatIsPlex = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/what-is-plex"
        homeElement={'Help Centre'}
        names="Getting Started,What is Plex&trade;?"
      />
      <div>WhatIsPlex</div>
    </section>
  );
};

export default WhatIsPlex;
