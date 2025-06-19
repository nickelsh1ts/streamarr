/* eslint-disable @next/next/no-css-tags */
import BackButton from '@app/components/Layout/BackButton';
import MobileMenu from '@app/components/Layout/MobileMenu';
import Sidebar from '@app/components/Layout/Sidebar';
import Watch from '@app/components/Watch';
import WelcomeModal from '@app/components/WelcomeModal';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata, NextPage } from 'next';

const messages = { title: 'Now Streaming' };

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

const WatchPage: NextPage = () => {
  return (
    <Watch>
      <link rel="stylesheet" href="/tailwind.css" />
      <link rel="stylesheet" href="/watch.css" />
      <div className="fixed top-[0.6rem] left-2 sm:max-lg:left-[3.2rem] pointer-events-none pwa-only z-[1006]">
        <BackButton />
      </div>
      <Sidebar />
      <MobileMenu />
      <WelcomeModal />
    </Watch>
  );
};

export default WatchPage;
