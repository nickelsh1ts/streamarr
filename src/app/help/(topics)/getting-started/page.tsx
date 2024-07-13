import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const GettingStarted = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started"
        homeElement={'Help Centre'}
        names="Getting Started"
      />
      <div>Getting Started</div>
    </section>
  );
};

export default GettingStarted;
