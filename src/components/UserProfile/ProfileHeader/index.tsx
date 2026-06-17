import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import { useUser } from '@app/hooks/useUser';
import { CogIcon, UserIcon } from '@heroicons/react/24/solid';
import { Permission } from '@server/lib/permissions';
import Link from 'next/link';
import { FormattedDate, FormattedMessage } from 'react-intl';

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
  const { user: loggedInUser, hasPermission } = useUser();
  const subtextItems: React.ReactNode[] = [
    <>
      <FormattedMessage
        id="profile.joined"
        defaultMessage="Joined {date}"
        values={{
          date: (
            <FormattedDate
              value={user.createdAt}
              year="numeric"
              month="long"
              day="numeric"
            />
          ),
        }}
      />
    </>,
  ];

  if (hasPermission(Permission.MANAGE_INVITES)) {
    subtextItems.push(
      <span>
        <FormattedMessage
          id="profile.userId"
          defaultMessage="User ID: {userId}"
          values={{ userId: user.id }}
        />
      </span>
    );
  }

  return (
    <div
      className="relative mt-6 mb-12 pt-4 lg:flex lg:items-end lg:justify-between lg:space-x-5"
      data-testid="profile-header"
    >
      <div className="flex items-end justify-items-end space-x-5">
        <div className="shrink-0">
          <div className="relative">
            <CachedImage
              className="bg-primary-content ring-primary-content h-24 w-24 rounded-full object-cover ring-1"
              src={`/avatarproxy/${user.id}`}
              alt=""
              width={96}
              height={96}
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
            {user.email && user.displayName?.toLowerCase() !== user.email && (
              <span className="text-sm sm:ml-2 sm:text-lg">({user.email})</span>
            )}
          </h1>
          <p className="text-neutral text-sm font-medium">
            {subtextItems.map((item, idx) => (
              <span key={idx}>
                {idx > 0 && ' | '}
                {item}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse lg:flex-row lg:justify-end lg:space-y-0 lg:space-x-3 lg:space-x-reverse">
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
            <Button
              buttonSize="sm"
              buttonType="primary"
              data-testid="profile-edit-settings-button"
              className="max-lg:w-full"
            >
              <CogIcon className="mr-2 size-5" />
              <span>
                <FormattedMessage
                  id="profile.editSettings"
                  defaultMessage="Edit Settings"
                />
              </span>
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
              <Button
                buttonSize="sm"
                buttonType="primary"
                className="max-lg:w-full"
              >
                <UserIcon className="mr-2 size-5" />
                <span>
                  <FormattedMessage
                    id="profile.viewProfile"
                    defaultMessage="View Profile"
                  />
                </span>
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
