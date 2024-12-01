import UserSettings from '@app/components/UserProfile/UserSettings';

const ProfileSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  return <UserSettings>{children}</UserSettings>;
};
export default ProfileSettingsLayout;
