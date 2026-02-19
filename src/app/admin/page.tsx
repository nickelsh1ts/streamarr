import SettingsLayout from '@app/app/admin/settings/layout';
import GeneralSettings from '@app/components/Admin/Settings/General';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin');

const AdminPage = () => {
  return (
    <SettingsLayout>
      <GeneralSettings />
    </SettingsLayout>
  );
};
export default AdminPage;
