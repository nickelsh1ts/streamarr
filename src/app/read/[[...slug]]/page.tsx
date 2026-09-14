import Read from '@app/components/Read';
import { withVersion } from '@app/utils/assetVersion';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Read');

const ReadPage: NextPage = () => {
  return (
    <Read>
      <link rel="stylesheet" href={withVersion('/read.css')} />
    </Read>
  );
};
export default ReadPage;
