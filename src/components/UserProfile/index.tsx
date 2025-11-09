'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { Permission, useUser } from '@app/hooks/useUser';
import type {
  QuotaResponse,
  UserInvitesResponse,
  UserNotificationsResponse,
} from '@server/interfaces/api/userInterfaces';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Error from '@app/app/error';
import useSWR from 'swr';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import Slider from '@app/components/Common/Slider';
import RecentInvite from '@app/components/Common/Slider/RecentInvite';
import { FormattedMessage } from 'react-intl';
import RecentNotification from '@app/components/Common/Slider/RecentNotification';
import useSettings from '@app/hooks/useSettings';

const UserProfile = () => {
  const currentSettings = useSettings().currentSettings;
  const userQuery = useParams<{ userid: string }>();
  const { user, error, hasPermission } = useUser({
    id: Number(userQuery.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();

  const { data: invites, error: inviteError } = useSWR<UserInvitesResponse>(
    user &&
      currentSettings.enableSignUp &&
      (user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        ))
      ? `/api/v1/user/${user?.id}/invites?take=10&skip=0`
      : null
  );
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

  const { data: notifications, error: notificationError } =
    useSWR<UserNotificationsResponse>(
      user &&
        currentSettings.inAppEnabled &&
        (user.id === currentUser?.id ||
          currentHasPermission(
            [Permission.VIEW_NOTIFICATIONS, Permission.MANAGE_NOTIFICATIONS],
            { type: 'or' }
          ))
        ? `/api/v1/user/${user.id}/notifications?take=10&skip=0`
        : null
    );

  if (!user && !error) {
    return <LoadingEllipsis />;
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
    <div className="mb-4">
      {quota &&
        (user.id === currentUser?.id ||
          currentHasPermission(
            [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
            { type: 'and' }
          )) && (
          <div className="relative">
            <dl className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary sm:p-6">
                <dt className="truncate text-sm font-bold text-gray-300">
                  <FormattedMessage
                    id="profile.totalInvites"
                    defaultMessage="Total Invites"
                  />
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
                    {user.inviteCount || (
                      <FormattedMessage
                        id="common.none"
                        defaultMessage="None"
                      />
                    )}
                  </Link>
                </dd>
              </div>
              <div
                className={`overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary ${
                  quota.invite.restricted
                    ? 'bg-gradient-to-t from-red-900 to-transparent ring-red-500'
                    : 'ring-gray-700'
                } sm:p-6`}
              >
                <dt
                  className={`truncate text-sm font-bold text-gray-300 ${
                    quota.invite.restricted ? 'text-red-500' : 'text-gray-300'
                  }`}
                >
                  {quota.invite.limit ? (
                    quota.invite.days === 0 || quota.invite.limit === -1 ? (
                      <FormattedMessage
                        id="profile.invitesLifetime"
                        defaultMessage="Invites (Lifetime)"
                      />
                    ) : (
                      <FormattedMessage
                        id="profile.invitesPastDays"
                        defaultMessage="Invites (past {days} {days, plural, one {day} other {days}})"
                        values={{ days: quota.invite.days }}
                      />
                    )
                  ) : (
                    <FormattedMessage
                      id="common.invites"
                      defaultMessage="Invites"
                    />
                  )}
                </dt>
                <dd
                  className={`mt-1 text-sm font-semibold items-center flex text-white ${
                    quota.invite.restricted ? 'text-red-500' : 'text-white'
                  }`}
                >
                  {quota.invite.limit > 0 &&
                  hasPermission(
                    [Permission.STREAMARR, Permission.CREATE_INVITES],
                    { type: 'or' }
                  ) ? (
                    <>
                      <ProgressCircle
                        progress={Math.round(
                          ((quota?.invite.remaining ?? 0) /
                            (quota?.invite.limit ?? 1)) *
                            100
                        )}
                        useHeatLevel
                        className="mr-2 h-8 w-8"
                      />
                      <div>
                        <span className="text-3xl font-semibold">
                          <FormattedMessage
                            id="profile.invitesRemaining"
                            defaultMessage="{remaining} of {limit} remaining"
                            values={{
                              remaining: quota.invite.remaining,
                              limit: quota.invite.limit,
                            }}
                          />
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold">
                      {quota.invite.limit === -1 ? (
                        <FormattedMessage
                          id="common.unlimited"
                          defaultMessage="Unlimited"
                        />
                      ) : (
                        <FormattedMessage
                          id="common.none"
                          defaultMessage="None"
                        />
                      )}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      {(user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        )) &&
        (!invites || !!invites.results.length) &&
        !inviteError && (
          <>
            <div className="flex my-4 relative">
              <Link
                className="flex items-center gap-2 link-primary"
                href={
                  user.id === currentUser?.id
                    ? '/profile/invites?filter=all'
                    : `/admin/users/${user?.id}/invites?filter=all`
                }
              >
                <span className="text-2xl font-bold">
                  <FormattedMessage
                    id="profile.recentInvites"
                    defaultMessage="Recent Invites"
                  />
                </span>
                <ArrowRightCircleIcon className="size-5" />
              </Link>
            </div>
            <Slider
              sliderKey="invites"
              isLoading={!invites}
              items={(invites?.results ?? []).map((invite) => (
                <RecentInvite
                  key={`invite-slider-item-${invite.id}`}
                  invite={invite}
                />
              ))}
              placeholder={<RecentInvite.Placeholder />}
            />
          </>
        )}
      {(user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_NOTIFICATIONS, Permission.VIEW_NOTIFICATIONS],
          { type: 'or' }
        )) &&
        (!notifications || !!notifications.results.length) &&
        !notificationError && (
          <>
            <div className="flex my-4 relative">
              <Link
                className="flex items-center gap-2 link-primary"
                href={
                  user.id === currentUser?.id
                    ? '/profile/notifications?filter=all'
                    : `/admin/users/${user?.id}/notifications?filter=all`
                }
              >
                <span className="text-2xl font-bold">
                  <FormattedMessage
                    id="profile.recentNotifications"
                    defaultMessage="Recent Notifications"
                  />
                </span>
                <ArrowRightCircleIcon className="size-5" />
              </Link>
            </div>
            <Slider
              sliderKey="notifications"
              isLoading={!notifications}
              items={(notifications?.results ?? []).map((notification) => (
                <RecentNotification
                  key={`notification-slider-item-${notification.id}`}
                  notification={notification}
                />
              ))}
              placeholder={<RecentNotification.Placeholder />}
            />
          </>
        )}
    </div>
  );
};

export default UserProfile;
