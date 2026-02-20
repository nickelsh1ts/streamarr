import GeneralSettings from '@app/components/Admin/Settings/General';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - General Settings');

const GeneralPage = () => {
  return <GeneralSettings />;
};
export default GeneralPage;
