'use client';
import ComingSoon from '@app/components/Common/ComingSoon';
import ImageFader from '@app/components/Common/ImageFader';
import ProfileHeader from '@app/components/UserProfile/ProfileHeader';
import useBackdrops from '@app/hooks/useBackdrops';
import moment from 'moment';
import { useParams, usePathname } from 'next/navigation';

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSettingsPage = !!pathname.match(/\/settings/);
  const userQuery = useParams<{ userid: string }>();
  const backdrops = useBackdrops();
  let user;

  if (!userQuery.userid) {
    user = {
      id: 1,
      displayName: 'Nickelsh1ts',
      avatar: '/android-chrome-192x192.png',
      email: `nickelsh1ts@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
    };
  } else {
    user = {
      id: parseInt(userQuery.userid),
      displayName: 'QueriedUser',
      avatar: '/android-chrome-192x192.png',
      email: `query@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.dev`,
      createdAt: moment().toDate(),
    };
  }
  return (
    <div className="max-sm:mb-14 px-4">
      {pathname.match(/\/(profile|admin\/users\/(\d)*?)\/?$/) && (
        <div className="absolute left-0 right-0 -top-18 z-0 h-96">
          <ImageFader
            rotationSpeed={6000}
            gradient="bg-gradient-to-t from-[#1f1f1f] from-0% to-secondary/85 to-75%"
            backgroundImages={
              backdrops?.map(
                (backdrop) =>
                  `https://image.tmdb.org/t/p/original${backdrop.url}`
              ) ?? []
            }
          />
        </div>
      )}
      {!pathname.includes('/invites') && (
        <ProfileHeader isSettingsPage={isSettingsPage} user={user} />
      )}
      {children}
      <ComingSoon />
    </div>
  );
};
export default ProfileLayout;
