import AdminMusic from '@app/components/Admin/Music';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Music - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const MusicPage = () => {
  return <AdminMusic />;
};
export default MusicPage;
