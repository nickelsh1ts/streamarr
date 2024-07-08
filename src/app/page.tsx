import Index from '@app/components/Index';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Stream the greatest Movies, Series, Classics and more',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const IndexPage: NextPage = () => {
  return (<Index />)
};

export default IndexPage;
