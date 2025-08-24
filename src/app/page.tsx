import Index from '@app/components/Index';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata, NextPage } from 'next';

const messages = {
  title: 'Stream the greatest Movies, Shows, Classics and more',
};

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

const IndexPage: NextPage = () => {
  return <Index />;
};

export default IndexPage;
