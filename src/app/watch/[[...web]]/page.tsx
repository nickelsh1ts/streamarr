import BackButton from '@app/components/Layout/BackButton';
import MobileMenu from '@app/components/Layout/MobileMenu';
import Sidebar from '@app/components/Layout/Sidebar';
import Watch from '@app/components/Watch';
import { withVersion } from '@app/utils/assetVersion';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Now Streaming');

const WatchPage: NextPage = () => {
  return (
    <Watch>
      <link rel="stylesheet" href={withVersion('/watch.base.css')} />
      <link rel="stylesheet" href={withVersion('/watch.css')} />
      <div className="pwa-only pointer-events-none fixed top-[0.6rem] left-2 z-1006 sm:max-lg:left-[3.2rem]">
        <BackButton />
      </div>
      <Sidebar />
      <MobileMenu />
    </Watch>
  );
};

export default WatchPage;
