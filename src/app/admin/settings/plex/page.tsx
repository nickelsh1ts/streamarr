import PlexSettings from '@app/components/Admin/Settings/Plex';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Plex settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const SettingsPlexPage = () => {
  return <PlexSettings />;
};
export default SettingsPlexPage;
