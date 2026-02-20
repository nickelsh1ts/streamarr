import JobsCacheSettings from '@app/components/Admin/Settings/JobsCache';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Jobs & Cache');

const JobsPage = () => {
  return <JobsCacheSettings />;
};
export default JobsPage;
