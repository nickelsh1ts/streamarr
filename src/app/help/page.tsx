import Help from '@app/components/Help';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Help Centre');

const HelpPage: NextPage = () => {
  return <Help />;
};

export default HelpPage;
