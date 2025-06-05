import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import DeviceTabs from '@app/components/Help/Devices';
import Header from '@app/components/Help/Devices/Header';

const Devices = () => {
  return (
    <section className="text-neutral bg-zinc-100 pt-5">
      <Breadcrumbs
        paths="/watching-streamarr/devices"
        homeElement={'Help Centre'}
        names={`Watching ${process.env.NEXT_PUBLIC_APP_NAME},Connect to ${process.env.NEXT_PUBLIC_APP_NAME} using your favourite devices`}
        print={false}
      />
      <Header />
      <DeviceTabs />
    </section>
  );
};

export default Devices;
