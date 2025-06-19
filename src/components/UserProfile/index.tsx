'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { Permission, useUser } from '@app/hooks/useUser';
import type {
  QuotaResponse,
  UserInvitesResponse,
} from '@server/interfaces/api/userInterfaces';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Error from '@app/app/error';
import useSWR from 'swr';

const UserProfile = () => {
  const userQuery = useParams<{ userid: string }>();
  const { user, error } = useUser({
    id: Number(userQuery.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: invites, error: inviteError } = useSWR<UserInvitesResponse>(
    user &&
      (user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        ))
      ? `/api/v1/user/${user?.id}/requests?take=10&skip=0`
      : null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: quota } = useSWR<QuotaResponse>(
    user &&
      (user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
          { type: 'and' }
        ))
      ? `/api/v1/user/${user.id}/quota`
      : null
  );

  if (!user && !error) {
    return <LoadingEllipsis fixed />;
  }

  if (!user) {
    return (
      <Error
        error={{ name: '404', message: 'User not found', statusCode: 404 }}
        reset={() => {}}
      />
    );
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
                {currentUser.inviteLimit - currentUser.invitesSent || 'none'}
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
