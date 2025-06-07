import JobsCacheSettings from '@app/components/Admin/Settings/JobsCache';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Jobs & Cache - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const JobsPage = () => {
  return <JobsCacheSettings />;
};
export default JobsPage;
