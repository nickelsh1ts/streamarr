import AdminIndexers from '@app/components/Admin/Indexers';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Indexers');

const IndexersPage = () => {
  return <AdminIndexers />;
};
export default IndexersPage;
