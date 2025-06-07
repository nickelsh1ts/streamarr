import EmailNotifications from '@app/components/Admin/Settings/Notifications/EmailNotifications';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Admin – Notification settings - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const SettingsNotificationsPage = () => {
  return <EmailNotifications />;
};
export default SettingsNotificationsPage;
