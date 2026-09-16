import AdminBooks from '@app/components/Admin/Books';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Books');

const BooksPage = () => {
  return <AdminBooks />;
};
export default BooksPage;
