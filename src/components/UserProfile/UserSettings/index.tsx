'use client';
import ProfileHeader from '@app/components/UserProfile/ProfileHeader';
import moment from 'moment';
import { useParams } from 'next/navigation';

const UserSettings = () => {
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
  return <ProfileHeader isSettingsPage user={user} />;
};

export default UserSettings;
