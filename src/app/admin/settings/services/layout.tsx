import ServicesLayout from '@app/components/Admin/Settings/Services/layout';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Services');

const ServicesPageLayout = ({ children }: { children: React.ReactNode }) => {
  return <ServicesLayout>{children}</ServicesLayout>;
};
export default ServicesPageLayout;
