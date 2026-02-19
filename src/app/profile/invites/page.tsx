import Invite from '@app/components/InviteList';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Profile - Invites');

const ProfileInvitesPage = () => {
  return <Invite />;
};
export default ProfileInvitesPage;
