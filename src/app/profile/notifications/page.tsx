import Notifications from '@app/components/NotificationList';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () =>
  generatePageMetadata('Profile - Notifications');

const ProfileNotificationsPage = () => {
  return <Notifications />;
};
export default ProfileNotificationsPage;
