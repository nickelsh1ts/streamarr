import Schedule from '@app/components/Schedule';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

const messages = { title: 'Schedule' };

export async function generateMetadata(): Promise<Metadata> {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

  return {
    title: `${messages.title} - ${currentSettings.applicationTitle}`,
  };
}

const SchedulePage = () => {
  return <Schedule />;
};
export default SchedulePage;
