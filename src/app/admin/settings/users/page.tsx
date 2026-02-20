import UserSettings from '@app/components/Admin/Settings/Users';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - User Settings');

const SettingsUsersPage = () => {
  return <UserSettings />;
};
export default SettingsUsersPage;
