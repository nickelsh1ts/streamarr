import Stats from '@app/components/Stats';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Stats');

const StatsPage = () => {
  return <Stats />;
};

export default StatsPage;
