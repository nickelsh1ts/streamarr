import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const WatchOnTV = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/watch-on-tv"
        homeElement={'Help Centre'}
        names="Watching Streamarr,How can I watch Streamarr on my TV?"
      />
      <div>WatchOnTV</div>
    </section>
  );
};

export default WatchOnTV;
