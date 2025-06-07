import BackButton from '@app/components/Layout/BackButton';
import MobileMenu from '@app/components/Layout/MobileMenu';
import Sidebar from '@app/components/Layout/Sidebar';
import Watch from '@app/components/Watch';
import WelcomeModal from '@app/components/WelcomeModal';
import type { Metadata, NextPage } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = { title: 'Now Streaming' };

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

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
