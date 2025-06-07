import AdminTranscoding from '@app/components/Admin/Transcoding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Transcoding - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const TranscodePage = () => {
  return <AdminTranscoding />;
};
export default TranscodePage;
