'use client';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import moment from 'moment';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const UserProfile = () => {
  const userQuery = useParams<{ userid: string }>();
  let user;

  const currentUser = { id: 1, invitesRemaining: 'Unlimited', invitesSent: 15 };

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
    <>
      <div className="relative">
        <dl className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary sm:p-6">
            <dt className="truncate text-sm font-bold text-gray-300">
              Invites Remaining
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              <Link
                className="link-hover"
                href={
                  user.id === currentUser?.id
                    ? '/profile/invites?filter=all'
                    : `/admin/users/${user?.id}/invites?filter=all`
                }
              >
                {currentUser.invitesRemaining}
              </Link>
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary sm:p-6">
            <dt className="truncate text-sm font-bold text-gray-300">
              Invites Sent
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-white">
              <Link
                className="link-hover"
                href={
                  user.id === currentUser?.id
                    ? '/profile/invites?filter=all'
                    : `/admin/users/${user?.id}/invites?filter=all`
                }
              >
                {currentUser.invitesSent}
              </Link>
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex my-4 relative z-40">
        <Link
          className="flex items-center gap-2 link-primary"
          href={
            user.id === currentUser?.id
              ? '/profile/invites?filter=all'
              : `/admin/users/${user?.id}/invites?filter=all`
          }
        >
          <span className="text-2xl font-bold">Users Invited</span>
          <ArrowRightCircleIcon className="size-5" />
        </Link>
      </div>
    </>
  );
};

export default UserProfile;
