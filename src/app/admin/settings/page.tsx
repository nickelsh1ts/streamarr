import Settings from '@app/components/Admin/Settings/General';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - General Settings');

const SettingsPage = () => {
  return <Settings />;
};
export default SettingsPage;
