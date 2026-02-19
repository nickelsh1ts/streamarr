/* eslint-disable @next/next/no-css-tags */
import Request from '@app/components/Request';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Request');

const RequestPage: NextPage = () => {
  return (
    <Request>
      <link rel="stylesheet" href="/request.css" />
    </Request>
  );
};
export default RequestPage;
