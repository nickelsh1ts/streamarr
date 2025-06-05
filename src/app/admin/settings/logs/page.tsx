import LogsSettings from '@app/components/Admin/Settings/Logs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Logs - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const LogsPage = () => {
  return <LogsSettings />;
};
export default LogsPage;
