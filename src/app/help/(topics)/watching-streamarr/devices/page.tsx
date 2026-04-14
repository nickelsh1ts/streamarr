'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import DeviceTabs from '@app/components/Help/Devices';
import Header from '@app/components/Help/Devices/Header';
import useSettings from '@app/hooks/useSettings';
import { useIntl } from 'react-intl';

const Devices = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  return (
    <section className="text-neutral bg-zinc-100 pt-5">
      <Breadcrumbs
        paths="/watching-streamarr/devices"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.devices.breadcrumb', defaultMessage: 'Connect to {appTitle} using your favourite devices' }, { appTitle: currentSettings.applicationTitle })}`}
        print={false}
      />
      <Header />
      <DeviceTabs />
    </section>
  );
};

export default Devices;
