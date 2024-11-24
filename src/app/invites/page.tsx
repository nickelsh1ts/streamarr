import Invite from '@app/components/Invite';
import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Invite a friend',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const InvitePage: NextPage = () => {
  return (
    <div className="max-sm:mb-14">
      <Invite />
    </div>
  );
};
export default InvitePage;
