import UserSettings from '@app/components/Admin/Settings/Users';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – User settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const SettingsUsersPage = () => {
  return <UserSettings />;
};
export default SettingsUsersPage;
