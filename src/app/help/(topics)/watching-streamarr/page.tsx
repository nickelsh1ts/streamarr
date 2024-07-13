import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const WatchingStreamarr = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr"
        homeElement={'Help Centre'}
        names="Watching Streamarr"
      />
      <div>Watching Streamarr</div>
    </section>
  );
};

export default WatchingStreamarr;
