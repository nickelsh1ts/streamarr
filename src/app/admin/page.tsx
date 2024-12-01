import SettingsLayout from '@app/app/admin/settings/layout';
import GeneralSettings from '@app/components/Admin/Settings/General';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin – Streamarr',
};

const AdminPage = () => {
  return (
    <SettingsLayout>
      <GeneralSettings />
    </SettingsLayout>
  );
};
export default AdminPage;
