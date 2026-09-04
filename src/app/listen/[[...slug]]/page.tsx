import Listen from '@app/components/Listen';
import { withVersion } from '@app/utils/assetVersion';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Listen');

const ListenPage: NextPage = () => {
  return (
    <Listen>
      <link rel="stylesheet" href={withVersion('/listen.css')} />
    </Listen>
  );
};

export default ListenPage;
