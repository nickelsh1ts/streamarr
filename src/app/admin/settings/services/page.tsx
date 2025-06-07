import ServicesOverseerr from '@app/components/Admin/Settings/Services/Overseerr';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Services - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const SettingsServicesPage = () => {
  return <ServicesOverseerr />;
};
export default SettingsServicesPage;
