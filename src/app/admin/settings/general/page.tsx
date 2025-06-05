import GeneralSettings from '@app/components/Admin/Settings/General';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – General settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const GeneralPage = () => {
  return <GeneralSettings />;
};
export default GeneralPage;
