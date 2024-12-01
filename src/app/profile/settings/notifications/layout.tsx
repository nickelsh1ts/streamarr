import UserSettingsNotifications from '@app/components/UserProfile/UserSettings/UserSettingsNotifications';

const ProfileNotificationsLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <UserSettingsNotifications>{children}</UserSettingsNotifications>;
};
export default ProfileNotificationsLayout;
