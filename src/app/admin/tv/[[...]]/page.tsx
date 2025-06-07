import AdminTVShows from '@app/components/Admin/TVShows';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Shows - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const TVPage = () => {
  return <AdminTVShows />;
};
export default TVPage;
