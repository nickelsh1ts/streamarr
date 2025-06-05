import AdminSubtitles from '@app/components/Admin/Subtitles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Subtitles - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const SubtitlesPage = () => {
  return <AdminSubtitles />;
};
export default SubtitlesPage;
