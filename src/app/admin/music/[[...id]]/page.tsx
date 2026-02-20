import AdminMusic from '@app/components/Admin/Music';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Music');

const MusicPage = () => {
  return <AdminMusic />;
};
export default MusicPage;
