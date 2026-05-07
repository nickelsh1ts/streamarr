'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { Permission, useUser, UserType } from '@app/hooks/useUser';
import type {
  QuotaResponse,
  UserInvitesResponse,
  UserNotificationsResponse,
  UserWatchDataResponse,
} from '@server/interfaces/api/userInterfaces';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import type {
  SeerrQuotaResponse,
  SeerrRequestsResponse,
} from '@server/interfaces/api/seerrInterfaces';
import { ArrowRightCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Error from '@app/app/error';
import useSWR from 'swr';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import Slider from '@app/components/Common/Slider';
import RecentInvite from '@app/components/Common/Slider/RecentInvite';
import { FormattedMessage } from 'react-intl';
import RecentNotification from '@app/components/Common/Slider/RecentNotification';
import RecentlyWatched from '@app/components/Common/Slider/RecentlyWatched';
import useSettings from '@app/hooks/useSettings';
import { momentWithLocale } from '@app/utils/momentLocale';
import RecentRequest from '@app/components/Common/Slider/RecentRequest';

const Placeholder = () => {
  return (
    <div className="relative animate-pulse p-4 rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary sm:p-6 flex flex-row gap-8">
      <div className="w-24 sm:w-24">
        <div className="w-full" style={{ paddingBottom: '63%' }} />
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { currentSettings } = useSettings();
  const userQuery = useParams<{ userid: string }>();
  const { user, error, hasPermission } = useUser({
    id: Number(userQuery.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const { data: notificationSettings } =
    useSWR<UserSettingsNotificationsResponse>(
      currentUser
        ? `/api/v1/user/${currentUser?.id}/settings/notifications`
        : null
    );
  const { data: invites, error: inviteError } = useSWR<UserInvitesResponse>(
    user &&
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
        notificationSettings?.inAppEnabled &&
        (user.id === currentUser?.id ||
          currentHasPermission(
            [Permission.VIEW_NOTIFICATIONS, Permission.MANAGE_NOTIFICATIONS],
            { type: 'or' }
          ))
        ? `/api/v1/user/${user.id}/notifications?take=10&skip=0`
        : null
    );

  const { data: requests, error: requestError } = useSWR<SeerrRequestsResponse>(
    user &&
      currentSettings.seerrEnabled &&
      (user.id === currentUser?.id ||
        currentHasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${user.id}/requests?take=20&skip=0`
      : null
  );

  const { data: watchData, error: watchError } = useSWR<UserWatchDataResponse>(
    user &&
      user.userType === UserType.PLEX &&
      (user.id === currentUser?.id ||
        currentHasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${user.id}/watched?take=40&skip=0`
      : null
  );

  const { data: seerrUserQuota } = useSWR<SeerrQuotaResponse>(
    user &&
      currentSettings.seerrEnabled &&
      (user.id === currentUser?.id ||
        currentHasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${user.id}/settings/seerr/quota`
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

  const movieRestricted =
    (seerrUserQuota?.movieQuotaLimit ?? 0) > 0 &&
    seerrUserQuota?.movieQuotaRemaining === 0;
  const tvRestricted =
    (seerrUserQuota?.tvQuotaLimit ?? 0) > 0 &&
    seerrUserQuota?.tvQuotaRemaining === 0;
  const anyRestricted = movieRestricted || tvRestricted;

  return (
    <div className="mb-8">
      <div className="relative">
        <dl className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {(user.id === currentUser?.id ||
            currentHasPermission(
              [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
              { type: 'and' }
            )) &&
            (user.inviteCountRedeemed > 0 ||
              currentSettings.enableSignUp ||
              user.redeemedInvite?.createdBy) && (
              <div className="overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary sm:p-6 flex flex-row gap-8">
                {(currentSettings.enableSignUp ||
                  user.inviteCountRedeemed > 0) && (
                  <div>
                    <dt className="truncate text-sm font-bold text-primary-content">
                      <FormattedMessage
                        id="profile.usersInvited"
                        defaultMessage="Users Invited"
                      />
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-primary-content">
                      <Link
                        className="link-hover"
                        href={
                          user.id === currentUser?.id
                            ? '/profile/invites?filter=redeemed'
                            : `/admin/users/${user?.id}/invites?filter=redeemed`
                        }
                      >
                        {user.inviteCountRedeemed || (
                          <FormattedMessage
                            id="common.none"
                            defaultMessage="None"
                          />
                        )}
                      </Link>
                    </dd>
                  </div>
                )}
                {user.redeemedInvite?.createdBy && (
                  <div>
                    <dt className="truncate text-sm font-bold text-primary-content">
                      <FormattedMessage
                        id="profile.invitedBy"
                        defaultMessage="Invited By"
                      />
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-primary-content">
                      {currentHasPermission(Permission.MANAGE_USERS) ? (
                        <Link
                          className="link-hover"
                          href={
                            user.redeemedInvite.createdBy.id === currentUser?.id
                              ? '/profile'
                              : `/admin/users/${user.redeemedInvite.createdBy.id}`
                          }
                        >
                          {user.redeemedInvite.createdBy.displayName}
                        </Link>
                      ) : (
                        user.redeemedInvite.createdBy.displayName
                      )}
                    </dd>
                  </div>
                )}
              </div>
            )}
          {currentSettings.enableSignUp ? (
            quota ? (
              <>
                {quota.invite.trialPeriodActive &&
                quota.invite.trialPeriodEnabled ? (
                  <div className="overflow-hidden rounded-lg bg-yellow-900 bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-yellow-500 sm:p-6">
                    <dt className="truncate text-sm font-bold text-yellow-300 flex items-center">
                      <ClockIcon className="size-5 mr-2" />
                      <FormattedMessage
                        id="settings.trialPeriod"
                        defaultMessage="Trial Period"
                      />
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-yellow-200">
                      <div className="text-3xl">
                        <FormattedMessage
                          id="profile.trialPeriodEnds"
                          defaultMessage="Ends {date}"
                          values={{
                            date: momentWithLocale(
                              quota.invite.trialPeriodEndsAt ?? new Date()
                            ).format('ll'),
                          }}
                        />
                      </div>
                    </dd>
                  </div>
                ) : (
                  <div
                    className={`overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary ${
                      quota.invite.restricted &&
                      'bg-gradient-to-t from-error/60 to-transparent ring-error'
                    } sm:p-6`}
                  >
                    <dt
                      className={`truncate text-sm font-bold ${
                        quota.invite.restricted
                          ? 'text-error'
                          : 'text-primary-content'
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
                      className={`mt-1 text-sm font-semibold items-center flex ${
                        quota.invite.restricted
                          ? 'text-error'
                          : 'text-primary-content'
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
                          <div className="w-full overflow-hidden truncate">
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
                )}
              </>
            ) : (
              <Placeholder />
            )
          ) : null}
          {currentSettings.seerrEnabled ? (
            seerrUserQuota ? (
              <div
                className={`overflow-hidden rounded-lg bg-primary bg-opacity-30 backdrop-blur px-4 py-5 shadow ring-1 ring-primary ${
                  anyRestricted &&
                  'bg-gradient-to-t from-error/60 to-transparent ring-error'
                } sm:p-6 grid grid-cols-2 gap-x-4`}
              >
                <div className="text-sm font-bold col-span-2">
                  <FormattedMessage
                    id="common.requests"
                    defaultMessage="Requests"
                  />
                </div>
                <div className="overflow-hidden">
                  <dt
                    className={`truncate text-sm font-bold ${
                      movieRestricted ? 'text-error' : 'text-primary-content'
                    }`}
                  >
                    {(seerrUserQuota.movieQuotaLimit ?? 0) > 0 ? (
                      seerrUserQuota.movieQuotaDays == null ||
                      seerrUserQuota.movieQuotaDays === 0 ? (
                        <FormattedMessage
                          id="profile.moviesLifetime"
                          defaultMessage="Movies (Lifetime)"
                        />
                      ) : (
                        <FormattedMessage
                          id="profile.moviesPastDays"
                          defaultMessage="Movies (past {days} {days, plural, one {day} other {days}})"
                          values={{ days: seerrUserQuota.movieQuotaDays }}
                        />
                      )
                    ) : (
                      <FormattedMessage
                        id="common.movies"
                        defaultMessage="Movies"
                      />
                    )}
                  </dt>
                  <dd
                    className={`flex items-center ${
                      movieRestricted ? 'text-error' : 'text-primary-content'
                    }`}
                  >
                    {(seerrUserQuota.movieQuotaLimit ?? 0) > 0 ? (
                      <>
                        <ProgressCircle
                          progress={Math.round(
                            ((seerrUserQuota.movieQuotaRemaining ?? 0) /
                              (seerrUserQuota.movieQuotaLimit ?? 1)) *
                              100
                          )}
                          useHeatLevel
                          className="mr-2 h-6 w-6 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <div className="text-xl font-semibold truncate">
                            <FormattedMessage
                              id="profile.quotaRemaining"
                              defaultMessage="{remaining} of {limit}"
                              values={{
                                remaining:
                                  seerrUserQuota.movieQuotaRemaining ?? 0,
                                limit: seerrUserQuota.movieQuotaLimit,
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="overflow-hidden">
                        <span className="text-xl font-semibold truncate">
                          <FormattedMessage
                            id="common.unlimited"
                            defaultMessage="Unlimited"
                          />
                        </span>
                      </div>
                    )}
                  </dd>
                </div>
                <div className="overflow-hidden">
                  <dt
                    className={`truncate text-sm font-bold ${
                      tvRestricted ? 'text-error' : 'text-primary-content'
                    }`}
                  >
                    {(seerrUserQuota.tvQuotaLimit ?? 0) > 0 ? (
                      seerrUserQuota.tvQuotaDays == null ||
                      seerrUserQuota.tvQuotaDays === 0 ? (
                        <FormattedMessage
                          id="profile.tvLifetime"
                          defaultMessage="TV Shows (Lifetime)"
                        />
                      ) : (
                        <FormattedMessage
                          id="profile.tvPastDays"
                          defaultMessage="TV Shows (past {days} {days, plural, one {day} other {days}})"
                          values={{ days: seerrUserQuota.tvQuotaDays }}
                        />
                      )
                    ) : (
                      <FormattedMessage
                        id="common.tvShows"
                        defaultMessage="TV Shows"
                      />
                    )}
                  </dt>
                  <dd
                    className={`flex items-center ${
                      tvRestricted ? 'text-error' : 'text-primary-content'
                    }`}
                  >
                    {(seerrUserQuota.tvQuotaLimit ?? 0) > 0 ? (
                      <>
                        <ProgressCircle
                          progress={Math.round(
                            ((seerrUserQuota.tvQuotaRemaining ?? 0) /
                              (seerrUserQuota.tvQuotaLimit ?? 1)) *
                              100
                          )}
                          useHeatLevel
                          className="mr-2 h-6 w-6 shrink-0"
                        />
                        <div className="text-xl font-semibold truncate">
                          <FormattedMessage
                            id="profile.quotaRemaining"
                            defaultMessage="{remaining} of {limit}"
                            values={{
                              remaining: seerrUserQuota.tvQuotaRemaining ?? 0,
                              limit: seerrUserQuota.tvQuotaLimit,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xl font-semibold">
                        <FormattedMessage
                          id="common.unlimited"
                          defaultMessage="Unlimited"
                        />
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            ) : (
              <Placeholder />
            )
          ) : null}
        </dl>
      </div>
      {(user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        )) &&
        (!invites || !!invites.results.length) &&
        !inviteError &&
        (currentSettings.enableSignUp ||
          (invites?.results.length ?? 0) > 0) && (
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
      {currentSettings.seerrEnabled &&
        (user.id === currentUser?.id ||
          currentHasPermission(Permission.MANAGE_USERS)) &&
        (!requests || !!requests.results.length) &&
        !requestError && (
          <>
            <div className="flex my-4 relative">
              <Link
                className="flex items-center gap-2 link-primary"
                href={
                  user.id === currentUser?.id
                    ? '/request/requests?filter=all'
                    : `/admin/settings/overseerr/users/${user?.id}/requests?filter=all`
                }
              >
                <span className="text-2xl font-bold">
                  <FormattedMessage
                    id="profile.recentRequests"
                    defaultMessage="Recent Requests"
                  />
                </span>
                <ArrowRightCircleIcon className="size-5" />
              </Link>
            </div>
            <Slider
              sliderKey="requests"
              isLoading={!requests}
              items={(requests?.results ?? []).map((request) => (
                <RecentRequest
                  key={`request-slider-item-${request.id}`}
                  request={request}
                />
              ))}
              placeholder={<RecentRequest.Placeholder />}
            />
          </>
        )}
      {user.userType === UserType.PLEX &&
        (user.id === currentUser?.id ||
          currentHasPermission(Permission.MANAGE_USERS)) &&
        !watchError &&
        (!watchData || !!watchData.results.length) && (
          <>
            <div className="flex my-4 relative">
              <Link
                className="flex items-center gap-2 link-primary"
                href="/stats/history"
              >
                <span className="text-2xl font-bold">
                  <FormattedMessage
                    id="profile.recentlyWatched"
                    defaultMessage="Recently Watched"
                  />
                </span>
                <ArrowRightCircleIcon className="size-5" />
              </Link>
            </div>
            <Slider
              sliderKey="watch"
              isLoading={!watchData && !watchError}
              items={(watchData?.results ?? []).map((item) => (
                <RecentlyWatched
                  key={`watch-slider-item-${item.ratingKey}`}
                  item={item}
                />
              ))}
              placeholder={<RecentlyWatched.Placeholder />}
            />
          </>
        )}
      {(user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_NOTIFICATIONS, Permission.VIEW_NOTIFICATIONS],
          { type: 'or' }
        )) &&
        (!notifications || !!notifications.results.length) &&
        !notificationError &&
        notificationSettings?.inAppEnabled && (
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
