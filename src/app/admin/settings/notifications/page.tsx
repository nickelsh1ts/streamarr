import EmailNotifications from '@app/components/Admin/Settings/Notifications/EmailNotifications';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Admin - Notification Settings');

const SettingsNotificationsPage = () => {
  return <EmailNotifications />;
};
export default SettingsNotificationsPage;
