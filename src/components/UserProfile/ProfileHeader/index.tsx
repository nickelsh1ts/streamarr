import Button from '@app/components/Common/Button';
import { CogIcon, UserIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

type User = {
  id: number;
  displayName: string;
  avatar: string;
  email: string;
  createdAt: Date;
};

interface ProfileHeaderProps {
  user: User;
  isSettingsPage?: boolean;
}

const ProfileHeader = ({ user, isSettingsPage }: ProfileHeaderProps) => {
  const subtextItems: React.ReactNode[] = [
    <>Joined {user.createdAt.toDateString()}</>,
  ];

  const loggedInUser = {
    id: 1,
  };

  subtextItems.push(`User ID: ${user.id}`);

  return (
    <div className="mt-6 mb-12 lg:flex lg:items-end lg:justify-between lg:space-x-5 mx-4 p-4 bg-gradient-to-b from-primary/40 via-secondary/30 to-secondary/0 backdrop-blur rounded-lg">
      <div className="flex items-end justify-items-end space-x-5">
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              className="h-24 w-24 rounded-full bg-primary-content object-cover ring-1 ring-primary-content"
              src={user.avatar}
              alt=""
            />
            <span
              className="absolute inset-0 rounded-full shadow-inner"
              aria-hidden="true"
            ></span>
          </div>
        </div>
        <div className="pt-1.5">
          <h1 className="mb-1 flex flex-col sm:flex-row sm:items-center">
            <Link
              href={
                user.id === loggedInUser?.id
                  ? '/profile'
                  : `/admin/users/${user.id}`
              }
              className="text-primary text-lg font-bold hover:opacity-70 sm:text-2xl"
            >
              {user.displayName}
            </Link>
            {user.email && user.displayName.toLowerCase() !== user.email && (
              <span className="text-sm text-primary-content sm:ml-2 sm:text-lg">
                ({user.email})
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-neutral-300">
            {subtextItems.reduce((prev, curr) => (
              <>
                {prev} | {curr}
              </>
            ))}
          </p>
        </div>
      </div>
      <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-3 lg:space-x-reverse">
        {(loggedInUser?.id === user.id || loggedInUser?.id === 1) &&
        !isSettingsPage ? (
          <Link
            href={
              loggedInUser.id === user.id
                ? `/profile/settings`
                : `/admin/users/${user.id}/settings`
            }
            passHref
          >
            <Button buttonSize="sm" className="max-lg:w-full">
              <CogIcon className="size-5" />
              <span>Edit Settings</span>
            </Button>
          </Link>
        ) : (
          isSettingsPage && (
            <Link
              href={
                loggedInUser?.id === user?.id
                  ? `/profile`
                  : `/admin/users/${user.id}`
              }
              passHref
            >
              <Button buttonSize="sm" className="max-lg:w-full">
                <UserIcon className="size-5" />
                <span>View Profile</span>
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
