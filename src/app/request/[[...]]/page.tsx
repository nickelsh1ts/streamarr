import Request from '@app/components/Request';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Request',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const RequestPage: NextPage = () => {
  return (
    <Request>
      <link rel="stylesheet" href="/request.css" />
    </Request>
  );
};
export default RequestPage;
