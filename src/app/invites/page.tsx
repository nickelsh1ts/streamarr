import Invite from '@app/components/Invite';
import type { Metadata, NextPage } from 'next';

const applicationTitle = process.env.NEXT_PUBLIC_APP_NAME;

const messages = {
  title: 'Invite a friend',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const InvitePage: NextPage = () => {
  return (
    <div className="max-sm:mb-14 px-4">
      <Invite />
    </div>
  );
};
export default InvitePage;
