'use client';
import ImageFader from '@app/components/Common/ImageFader';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import ProfileHeader from '@app/components/UserProfile/ProfileHeader';
import { useUser } from '@app/hooks/useUser';
import { useParams, usePathname } from 'next/navigation';
import Error from '@app/app/error';
import useSWR from 'swr';

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSettingsPage = !!pathname.match(/\/settings/);
  const userQuery = useParams<{ userid: string }>();
  const { user, error } = useUser({
    id: Number(userQuery.userid) || undefined,
  });
  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  if (!user && !error) {
    return <LoadingEllipsis />;
  }

  if (!user) {
    return (
      <Error
        statusCode={404}
        error={{ name: '404', message: 'User not found' }}
        reset={() => {}}
      />
    );
  }

  return (
    <div className="max-sm:mb-16 px-4">
      {pathname.match(/\/(profile|admin\/users\/(\d)*?)\/?$/) && (
        <div className="absolute left-0 right-0 -top-18 z-0 h-96">
          <ImageFader
            rotationSpeed={6000}
            gradient="bg-gradient-to-t from-base-300 from-0% to-secondary/85 to-75%"
            backgroundImages={
              backdrops?.map(
                (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
              ) ?? ['/img/people-cinema-watching.jpg']
            }
          />
        </div>
      )}
      {!pathname.includes('/invites') &&
        (!pathname.includes('/notifications') ||
          pathname.includes('/settings/notifications')) && (
          <ProfileHeader isSettingsPage={isSettingsPage} user={user} />
        )}
      {children}
    </div>
  );
};
export default ProfileLayout;
