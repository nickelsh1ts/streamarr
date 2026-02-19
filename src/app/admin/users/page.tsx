import AdminUsers from '@app/components/Admin/Users';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Users');
const UsersPage = () => {
  return <AdminUsers />;
};
export default UsersPage;
