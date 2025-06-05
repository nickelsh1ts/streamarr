import AboutSettings from '@app/components/Admin/Settings/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – About - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

const AboutPage = () => {
  return <AboutSettings />;
};
export default AboutPage;
