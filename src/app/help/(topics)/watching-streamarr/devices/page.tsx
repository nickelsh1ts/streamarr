import Breadcrumbs from '@app/components/Help/Breadcrumbs';

const Devices = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/devices"
        homeElement={'Help Centre'}
        names="Watching Streamarr,Connect to Streamarr using your favourite devices"
      />
      <div>Devices</div>
    </section>
  );
};

export default Devices;
