import SettingsLayout from '@app/app/admin/settings/layout';
import GeneralSettings from '@app/components/Admin/Settings/General';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const AdminPage = () => {
  return (
    <SettingsLayout>
      <GeneralSettings />
    </SettingsLayout>
  );
};
export default AdminPage;
