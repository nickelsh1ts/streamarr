import SystemSettings from '@app/components/Admin/Settings/System';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - System');

const SystemPage = () => {
  return <SystemSettings />;
};
export default SystemPage;
