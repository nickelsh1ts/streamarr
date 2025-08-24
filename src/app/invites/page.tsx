import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata, NextPage } from 'next';
import InviteList from '@app/components/InviteList';

const messages = { title: 'Invite a friend' };

export async function generateMetadata(): Promise<Metadata> {
  const res = await fetch(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`,
    { cache: 'no-store' }
  );
  const currentSettings: PublicSettingsResponse = await res.json();

  return {
    title: `${messages.title} - ${currentSettings.applicationTitle}`,
  };
}

const InvitePage: NextPage = () => {
  return (
    <div className="max-sm:mb-14 px-4">
      <InviteList />
    </div>
  );
};
export default InvitePage;
