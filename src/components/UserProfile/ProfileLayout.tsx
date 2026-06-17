'use client';
import Error from '@app/app/error';
import ImageFader from '@app/components/Common/ImageFader';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import ProfileHeader from '@app/components/UserProfile/ProfileHeader';
import { UserType, useUser } from '@app/hooks/useUser';
import type { UserWatchDataResponse } from '@server/interfaces/api/userInterfaces';
import { useParams, usePathname } from 'next/navigation';
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
  const { data: watchData } = useSWR<UserWatchDataResponse>(
    user?.userType === UserType.PLEX && !isSettingsPage
      ? `/api/v1/user/${user.id}/watched?take=40&skip=0`
      : null,
    { refreshInterval: 0, refreshWhenHidden: false, revalidateOnFocus: false }
  );

  const faderImages = (() => {
    const watchBackdrops = [
      ...new Set(
        watchData?.results
          .filter((r) => r.backdropPath)
          .map((r) => `https://image.tmdb.org/t/p/original${r.backdropPath}`)
      ),
    ];
    if (watchBackdrops.length) return watchBackdrops;
    return (
      backdrops?.map((b) => `https://image.tmdb.org/t/p/original${b}`) ?? [
        '/img/people-cinema-watching.jpg',
      ]
    );
  })();

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
    <div className="px-4 max-sm:mb-16">
      {pathname.match(/\/(profile|admin\/users\/(\d)*?)\/?$/) && (
        <div className="absolute -top-18 right-0 left-0 z-0 h-96">
          <ImageFader
            rotationSpeed={6000}
            gradient="bg-gradient-to-t from-base-300 from-0% to-secondary/85 to-75%"
            backgroundImages={faderImages}
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
