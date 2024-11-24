'use client';
import ProfileHeader from '@app/components/UserProfile/ProfileHeader';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSettingsPage = !!pathname.match(/\/settings/);
  const userQuery = useParams<{ userid: string }>();
  let user;

  if (!userQuery.userid) {
    user = {
      id: 1,
      displayName: 'Nickelsh1ts',
      avatar: '/android-chrome-192x192.png',
      email: 'nickelsh1ts@streamarr.dev',
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: 'query@streamarr.dev',
      createdAt: moment().toDate(),
    };
  }
  return (
    <>
      {!pathname.includes('/invites') && (
        <ProfileHeader isSettingsPage={isSettingsPage} user={user} />
      )}
      {children}
    </>
  );
};
export default ProfileLayout;
