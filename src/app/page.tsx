import Index from '@app/components/Index';
import type { Metadata, NextPage } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr';

const messages = {
  title: 'Stream the greatest Movies, Shows, Classics and more',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const IndexPage: NextPage = () => {
  return <Index />;
};

export default IndexPage;
