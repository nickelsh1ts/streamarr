import AdminIndexers from '@app/components/Admin/Indexers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Indexers - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const IndexersPage = () => {
  return <AdminIndexers />;
};
export default IndexersPage;
