import Listen from '@app/components/Listen';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Listen');

const ListenPage: NextPage = () => {
  return <Listen />;
};

export default ListenPage;
