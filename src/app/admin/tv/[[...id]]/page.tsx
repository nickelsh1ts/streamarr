import AdminTVShows from '@app/components/Admin/TVShows';
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
    title: `Admin - Shows - ${currentSettings.applicationTitle}`,
  };
}

const TVPage = () => {
  return <AdminTVShows />;
};
export default TVPage;
