import UserSettingsNotifications from '@app/components/UserProfile/UserSettings/UserSettingsNotifications';

const UserNotificationsLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <UserSettingsNotifications>{children}</UserSettingsNotifications>;
};
export default UserNotificationsLayout;
