import Setup from '@app/components/Setup';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Setup');
const SetupPage: NextPage = () => {
  return <Setup />;
};

export default SetupPage;
