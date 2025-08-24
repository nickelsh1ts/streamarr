import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import Invite from '@app/components/InviteList';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

  return {
    title: `Profile - Invites - ${currentSettings.applicationTitle}`,
  };
}

const ProfileInvitesPage = () => {
  return <Invite />;
};
export default ProfileInvitesPage;
