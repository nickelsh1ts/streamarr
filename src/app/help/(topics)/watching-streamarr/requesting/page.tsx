import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const Requesting = () => {
  return (
    <section className='text-neutral bg-zinc-100 py-5'>
      <Breadcrumbs
        paths="/watching-streamarr/requesting"
        homeElement={'Help Centre'}
        names="Watching Streamarr,Request new media with Overseerr"
      />
      <div>Requesting</div>
    </section>
  );
};

export default Requesting;
