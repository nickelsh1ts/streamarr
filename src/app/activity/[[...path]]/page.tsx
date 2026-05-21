import Activity from '@app/components/Activity';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Activity');

const ActivityPage = () => {
  return <Activity />;
};

export default ActivityPage;
