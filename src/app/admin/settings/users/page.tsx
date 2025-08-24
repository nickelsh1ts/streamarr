import UserSettings from '@app/components/Admin/Settings/Users';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

  return {
    title: `Admin - User Settings - ${currentSettings.applicationTitle}`,
  };
}

const SettingsUsersPage = () => {
  return <UserSettings />;
};
export default SettingsUsersPage;
