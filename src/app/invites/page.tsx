import InviteList from '@app/components/InviteList';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import type { NextPage } from 'next';

export const generateMetadata = () => generatePageMetadata('Invite a friend');

const InvitePage: NextPage = () => {
  return (
    <div className="max-sm:mb-14 px-4">
      <InviteList />
    </div>
  );
};
export default InvitePage;
