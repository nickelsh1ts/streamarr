import AdminCleaning from '@app/components/Admin/Cleaning';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Cleaning');

const CleaningPage = () => {
  return <AdminCleaning />;
};
export default CleaningPage;
