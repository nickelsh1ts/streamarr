import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const BecomeMember = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/become-a-member"
        homeElement={'Help Centre'}
        names="Getting Started,how to become a member of Streamarr"
      />
      <div>BecomeMember</div>
    </section>
  );
};

export default BecomeMember;
