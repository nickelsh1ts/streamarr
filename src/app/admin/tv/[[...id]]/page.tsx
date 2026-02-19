import AdminTVShows from '@app/components/Admin/TVShows';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Shows');

const TVPage = () => {
  return <AdminTVShows />;
};
export default TVPage;
