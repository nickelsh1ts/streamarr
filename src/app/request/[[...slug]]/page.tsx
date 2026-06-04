import Request from '@app/components/Request';
import { withVersion } from '@app/utils/assetVersion';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Request');

const RequestPage: NextPage = () => {
  return (
    <Request>
      <link rel="stylesheet" href={withVersion('/request.css')} />
    </Request>
  );
};
export default RequestPage;
