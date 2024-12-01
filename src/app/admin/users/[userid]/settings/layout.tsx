import UserSettings from '@app/components/UserProfile/UserSettings';

const UserSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  return <UserSettings>{children}</UserSettings>;
};
export default UserSettingsLayout;
