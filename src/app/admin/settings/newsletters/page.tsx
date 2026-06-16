import Newsletters from '@app/components/Admin/Settings/Newsletters';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Newsletter Settings');

const SettingsNewslettersPage = () => {
  return <Newsletters />;
};
export default SettingsNewslettersPage;
