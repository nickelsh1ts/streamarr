import NetworkSettings from '@app/components/Admin/Settings/Network';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Network Settings');

const NetworkPage = () => {
  return <NetworkSettings />;
};
export default NetworkPage;
