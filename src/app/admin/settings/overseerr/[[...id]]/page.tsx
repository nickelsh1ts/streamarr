import AdminOverseerr from '@app/components/Admin/Settings/Overseerr';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Overseerr');

const OverseerrPage = () => {
  return <AdminOverseerr />;
};
export default OverseerrPage;
