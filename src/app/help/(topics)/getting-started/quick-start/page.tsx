import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const QuickStart = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/quick-start"
        homeElement={'Help Centre'}
        names="Getting Started,Quick Start Guide"
      />
      <div>QuickStart</div>
    </section>
  );
};

export default QuickStart;
