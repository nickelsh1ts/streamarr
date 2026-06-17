'use client';
import Error from '@app/app/error';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import Slider from '@app/components/Common/Slider';
import RecentInvite from '@app/components/Common/Slider/RecentInvite';
import RecentNotification from '@app/components/Common/Slider/RecentNotification';
import RecentRequest from '@app/components/Common/Slider/RecentRequest';
import RecentlyWatched from '@app/components/Common/Slider/RecentlyWatched';
import useSettings from '@app/hooks/useSettings';
import { Permission, UserType, useUser } from '@app/hooks/useUser';
import { momentWithLocale } from '@app/utils/momentLocale';
import { ArrowRightCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type {
  SeerrQuotaResponse,
  SeerrRequestsResponse,
} from '@server/interfaces/api/seerrInterfaces';
import type {
  QuotaResponse,
  UserInvitesResponse,
  UserNotificationsResponse,
  UserWatchDataResponse,
} from '@server/interfaces/api/userInterfaces';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const Placeholder = () => {
  return (
    <div className="bg-primary/30 ring-primary relative flex animate-pulse flex-row gap-8 rounded-lg p-4 px-4 py-5 shadow ring-1 backdrop-blur sm:p-6">
      <div className="w-24 sm:w-24">
        <div className="w-full" style={{ paddingBottom: '63%' }} />
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { currentSettings } = useSettings();
  const userQuery = useParams<{ userid: string }>();
  const {
    user,
    error,
    hasPermission,
    revalidate: revalidateUser,
  } = useUser({
    id: Number(userQuery.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const { data: plexShareCheck } = useSWR<{ existsInPlex?: boolean }>(
    user?.userType === UserType.PLEX &&
      user?.id !== 1 &&
      currentHasPermission(Permission.MANAGE_USERS) &&
      !hasPermission(Permission.MANAGE_USERS)
      ? `/api/v1/user/${user?.id}/plex/libraries`
      : null,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (plexShareCheck?.existsInPlex === false && user?.active) {
      revalidateUser();
    }
  }, [plexShareCheck?.existsInPlex, user?.active, revalidateUser]);
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

  const isTrialExpiry = user?.accessRevokedReason !== 'plex_removed';

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

  const { data: seerrUserQuota, error: seerrUserQuotaError } =
    useSWR<SeerrQuotaResponse>(
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
              <div className="bg-primary/30 ring-primary flex flex-row gap-8 overflow-hidden rounded-lg px-4 py-5 shadow ring-1 backdrop-blur sm:p-6">
                {(currentSettings.enableSignUp ||
                  user.inviteCountRedeemed > 0) && (
                  <div>
                    <dt className="text-primary-content truncate text-sm font-bold">
                      <FormattedMessage
                        id="profile.usersInvited"
                        defaultMessage="Users Invited"
                      />
                    </dt>
                    <dd className="text-primary-content mt-1 text-3xl font-semibold">
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
                    <dt className="text-primary-content truncate text-sm font-bold">
                      <FormattedMessage
                        id="profile.invitedBy"
                        defaultMessage="Invited By"
                      />
                    </dt>
                    <dd className="text-primary-content mt-1 text-3xl font-semibold">
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
                {user.active &&
                quota.invite.trialPeriodActive &&
                quota.invite.trialPeriodEnabled ? (
                  <div className="overflow-hidden rounded-lg bg-yellow-900/30 px-4 py-5 shadow ring-1 ring-yellow-500 backdrop-blur sm:p-6">
                    <dt className="flex items-center truncate text-sm font-bold text-yellow-300">
                      <ClockIcon className="mr-2 size-5" />
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
                ) : !user.active ? (
                  <div className="overflow-hidden rounded-lg bg-red-900/30 px-4 py-5 shadow ring-1 ring-red-500 backdrop-blur sm:p-6 xl:col-span-2">
                    <dt className="flex items-center truncate text-sm font-bold text-red-300">
                      {isTrialExpiry ? (
                        <FormattedMessage
                          id="common.accountExpired"
                          defaultMessage="Account Expired"
                        />
                      ) : (
                        <FormattedMessage
                          id="common.accountDeactivated"
                          defaultMessage="Account Deactivated"
                        />
                      )}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-red-200">
                      {user?.id !== currentUser?.id ? (
                        isTrialExpiry ? (
                          <FormattedMessage
                            id="profile.accountExpiredMessageAdmin"
                            defaultMessage="This user's account has expired. {trialPeriodEnabled, select, true {Extend by setting a new trial period {link}.} other {Enable trial periods again to extend access.}}"
                            values={{
                              link: (
                                <Link
                                  href={`/admin/users/${user.id}/settings`}
                                  className="font-bold underline hover:text-red-300"
                                >
                                  <FormattedMessage
                                    id="common.here"
                                    defaultMessage="here"
                                  />
                                </Link>
                              ),
                              trialPeriodEnabled:
                                quota.invite.trialPeriodEnabled ?? false,
                            }}
                          />
                        ) : (
                          <FormattedMessage
                            id="profile.accountDeactivatedMessageAdmin"
                            defaultMessage="This user's account has been deactivated. You can reactivate them from their settings {link}."
                            values={{
                              link: (
                                <Link
                                  href={`/admin/users/${user.id}/settings`}
                                  className="font-bold underline hover:text-red-300"
                                >
                                  <FormattedMessage
                                    id="common.here"
                                    defaultMessage="here"
                                  />
                                </Link>
                              ),
                            }}
                          />
                        )
                      ) : isTrialExpiry ? (
                        <FormattedMessage
                          id="profile.accountExpiredMessage"
                          defaultMessage="Your account access has expired. {trialPeriodEnabled, select, true {You can request an extension {link}.} other {Contact an administrator to extend your access.}}"
                          values={{
                            link: (
                              <Link
                                href="/profile/settings"
                                className="font-bold underline hover:text-red-300"
                              >
                                <FormattedMessage
                                  id="common.here"
                                  defaultMessage="here"
                                />
                              </Link>
                            ),
                            trialPeriodEnabled:
                              quota.invite.trialPeriodEnabled ?? false,
                          }}
                        />
                      ) : (
                        <FormattedMessage
                          id="profile.accountDeactivatedMessage"
                          defaultMessage="Your account has been deactivated. {trialPeriodEnabled, select, true {You can request an access extension {link}.} other {Contact an administrator to restore your access.}}"
                          values={{
                            link: (
                              <Link
                                href="/profile/settings"
                                className="font-bold underline hover:text-red-300"
                              >
                                <FormattedMessage
                                  id="common.here"
                                  defaultMessage="here"
                                />
                              </Link>
                            ),
                            trialPeriodEnabled:
                              quota.invite.trialPeriodEnabled ?? false,
                          }}
                        />
                      )}
                    </dd>
                  </div>
                ) : (
                  <div
                    className={`bg-primary/30 ring-primary overflow-hidden rounded-lg px-4 py-5 shadow ring-1 backdrop-blur ${
                      quota.invite.restricted &&
                      'from-error/60 ring-error bg-linear-to-t to-transparent'
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
                      className={`mt-1 flex items-center text-sm font-semibold ${
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
                          <div className="w-full truncate overflow-hidden">
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
          {user.active &&
          currentSettings.seerrEnabled &&
          !seerrUserQuotaError ? (
            seerrUserQuota ? (
              <div
                className={`bg-primary/30 ring-primary overflow-hidden rounded-lg px-4 py-5 shadow ring-1 backdrop-blur ${
                  anyRestricted &&
                  'from-error/60 ring-error bg-linear-to-t to-transparent'
                } grid grid-cols-2 gap-x-4 sm:p-6`}
              >
                <div className="col-span-2 text-sm font-bold">
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
                          <div className="truncate text-xl font-semibold">
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
                        <span className="truncate text-xl font-semibold">
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
                        <div className="truncate text-xl font-semibold">
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
            <div className="relative my-4 flex">
              <Link
                className="link-primary flex items-center gap-2"
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
            <div className="relative my-4 flex">
              <Link
                className="link-primary flex items-center gap-2"
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
            <div className="relative my-4 flex">
              <Link
                className="link-primary flex items-center gap-2"
                href="/activity/history"
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
            <div className="relative my-4 flex">
              <Link
                className="link-primary flex items-center gap-2"
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
