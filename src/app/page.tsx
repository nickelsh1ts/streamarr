import Index from '@app/components/Index';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () =>
  generatePageMetadata('Stream the greatest Movies, Shows, Classics and more');

const IndexPage: NextPage = () => {
  return <Index />;
};

export default IndexPage;
