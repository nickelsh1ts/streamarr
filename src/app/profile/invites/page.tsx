import Invite from '@app/components/Invite';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Profile - Invites - ${process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}`,
};

const ProfileInvitesPage = () => {
  return <Invite />;
};
export default ProfileInvitesPage;
