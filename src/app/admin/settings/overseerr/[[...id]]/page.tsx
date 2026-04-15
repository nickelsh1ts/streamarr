import AdminOverseerr from '@app/components/Admin/Settings/Overseerr';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Seerr');

const OverseerrPage = () => {
  return <AdminOverseerr />;
};
export default OverseerrPage;
