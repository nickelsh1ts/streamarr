import Schedule from '@app/components/Schedule';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Schedule');

const SchedulePage = () => {
  return <Schedule />;
};
export default SchedulePage;
