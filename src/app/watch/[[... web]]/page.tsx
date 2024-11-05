import MobileMenu from '@app/components/Layout/MobileMenu';
import Sidebar from '@app/components/Layout/Sidebar';
import Watch from '@app/components/Watch';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Now Streaming',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const WatchPage: NextPage = () => {
  return (
    <Watch>
      <link rel="stylesheet" href="/tailwind.css" />
      <link rel="stylesheet" href="/watch.css" />
      <Sidebar />
      <MobileMenu />
    </Watch>
  );
};

export default WatchPage;
