import PlexSettings from '@app/components/Admin/Settings/Plex';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Plex Settings');

const SettingsPlexPage = () => {
  return <PlexSettings />;
};
export default SettingsPlexPage;
