/* eslint-disable @next/next/no-css-tags */
import BackButton from '@app/components/Layout/BackButton';
import MobileMenu from '@app/components/Layout/MobileMenu';
import Sidebar from '@app/components/Layout/Sidebar';
import Watch from '@app/components/Watch';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Now Streaming');

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
    </Watch>
  );
};

export default WatchPage;
