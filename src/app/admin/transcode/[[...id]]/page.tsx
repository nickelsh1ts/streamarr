import AdminTranscoding from '@app/components/Admin/Transcoding';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Transcoding');

const TranscodePage = () => {
  return <AdminTranscoding />;
};
export default TranscodePage;
