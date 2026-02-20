import AdminDownloads from '@app/components/Admin/Downloads';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Downloads');

const DownloadsPage = () => {
  return <AdminDownloads />;
};
export default DownloadsPage;
