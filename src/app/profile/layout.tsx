import ProfileLayout from '@app/components/UserProfile/ProfileLayout';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Profile');

const ProfilePageLayout = ({ children }: { children: React.ReactNode }) => {
  return <ProfileLayout>{children}</ProfileLayout>;
};
export default ProfilePageLayout;
