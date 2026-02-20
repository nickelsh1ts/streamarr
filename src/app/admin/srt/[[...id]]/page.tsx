import AdminSubtitles from '@app/components/Admin/Subtitles';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Subtitles');

const SubtitlesPage = () => {
  return <AdminSubtitles />;
};
export default SubtitlesPage;
