'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import DeviceTabs from '@app/components/Help/Devices';
import Header from '@app/components/Help/Devices/Header';
import useSettings from '@app/hooks/useSettings';

const Devices = () => {
  const { currentSettings } = useSettings();

  return (
    <section className="text-neutral bg-zinc-100 pt-5">
      <Breadcrumbs
        paths="/watching-streamarr/devices"
        homeElement={'Help Centre'}
        names={`Watching ${currentSettings.applicationTitle},Connect to ${currentSettings.applicationTitle} using your favourite devices`}
        print={false}
      />
      <Header />
      <DeviceTabs />
    </section>
  );
};

export default Devices;
