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
      <link
        rel="stylesheet"
        href="/_next/static/css/app/layout.css?v=1724611409484"
        data-precedence="next_static/css/app/layout.css"
      />
      <link href="/watch.css" rel="stylesheet" />
      <Sidebar />
    </Watch>
  );
};

export default WatchPage;
