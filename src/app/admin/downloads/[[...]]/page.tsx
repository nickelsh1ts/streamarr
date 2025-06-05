import AdminDownloads from '@app/components/Admin/Downloads';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Downloads - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const DownloadsPage = () => {
  return <AdminDownloads />;
};
export default DownloadsPage;
