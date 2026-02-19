import LogsSettings from '@app/components/Admin/Settings/Logs';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Logs');

const LogsPage = () => {
  return <LogsSettings />;
};
export default LogsPage;
