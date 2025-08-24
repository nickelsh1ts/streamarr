import Help from '@app/components/Help';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata, NextPage } from 'next';

const messages = { title: 'Help Centre' };

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

const HelpPage: NextPage = () => {
  return <Help />;
};

export default HelpPage;
