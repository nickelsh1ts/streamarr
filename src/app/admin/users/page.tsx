import AdminUsers from '@app/components/Admin/Users';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Users - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const UsersPage = () => {
  return <AdminUsers />;
};
export default UsersPage;
