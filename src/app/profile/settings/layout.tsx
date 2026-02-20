import UserSettings from '@app/components/UserProfile/UserSettings';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Profile - Settings');

const ProfileSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  return <UserSettings>{children}</UserSettings>;
};
export default ProfileSettingsLayout;
