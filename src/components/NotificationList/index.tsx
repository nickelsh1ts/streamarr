'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { NotificationCard } from '@app/components/NotificationList/NotificationCard';
import NotificationModal from '@app/components/NotificationList/NotificationModal';
import Toast from '@app/components/Toast';
import { useNotifications } from '@app/hooks/useNotifications';
import { Permission, useUser } from '@app/hooks/useUser';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import type Notification from '@server/entity/Notification';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

enum Filter {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

const getStoredNotificationFilterSettings = (): {
  currentFilter?: Filter;
  currentPageSize?: number;
} => {
  if (typeof window === 'undefined') return {};
  try {
    const filterString = window.localStorage.getItem('nl-filter-settings');
    return filterString ? JSON.parse(filterString) : {};
  } catch {
    window.localStorage.removeItem('nl-filter-settings');
    return {};
  }
};

const NotificationsList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(userQuery?.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const { data: notificationSettings } =
    useSWR<UserSettingsNotificationsResponse>(
      currentUser
        ? `/api/v1/user/${currentUser?.id}/settings/notifications`
        : null
    );
  const intl = useIntl();
  const [currentFilter, setCurrentFilter] = useState<Filter>(() => {
    const queryFilter = searchParams.get('filter') as Filter;
    if (Object.values(Filter).includes(queryFilter)) return queryFilter;
    return getStoredNotificationFilterSettings().currentFilter ?? Filter.ALL;
  });
  const [currentPageSize, setCurrentPageSize] = useState<number>(
    () => getStoredNotificationFilterSettings().currentPageSize ?? 10
  );

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const pageIndex = page - 1;

  const updateQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      router.push(pathname + '?' + params.toString());
    },
    [pathname, router, searchParams]
  );

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<NotificationResultsResponse>(
    user &&
      (user.id === currentUser?.id ||
        currentHasPermission(
          [Permission.MANAGE_NOTIFICATIONS, Permission.VIEW_NOTIFICATIONS],
          { type: 'or' }
        ))
      ? `/api/v1/user/${user?.id}/notifications?take=${currentPageSize}&skip=${
          pageIndex * currentPageSize
        }&filter=${currentFilter}`
      : null
  );
  const [editNotificationModal, setEditNotificationModal] = useState<{
    open: boolean;
    notification: null | Notification;
  }>({ open: false, notification: null });

  useNotifications();

  // Keep the filter in sync with the URL query param when it changes
  const queryFilter = searchParams.get('filter') as Filter;
  const [prevQueryFilter, setPrevQueryFilter] = useState(queryFilter);
  if (prevQueryFilter !== queryFilter) {
    setPrevQueryFilter(queryFilter);
    if (Object.values(Filter).includes(queryFilter)) {
      setCurrentFilter(queryFilter);
    }
  }

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'nl-filter-settings',
      JSON.stringify({
        currentFilter,
        currentPageSize,
      })
    );
  }, [currentFilter, currentPageSize]);

  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  const subtextItems: React.ReactNode[] | null =
    user?.id !== currentUser?.id && user?.displayName
      ? [user.displayName]
      : null;

  const deleteNotification = async (notificationId: number, userId: string) => {
    try {
      await axios.delete(
        `/api/v1/user/${userId}/notifications/${notificationId}`
      );
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'notification.deletedError',
          defaultMessage: 'Error deleting notification',
        }),
        type: 'error',
        icon: <TrashIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidate();
    }
  };

  const readNotification = async (
    notificationId: number,
    userId: string,
    isRead: boolean
  ) => {
    try {
      await axios.put(
        `/api/v1/user/${userId}/notifications/${notificationId}`,
        { isRead: isRead }
      );
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'notification.readError',
          defaultMessage: 'Error marking notification as read',
        }),
        type: 'error',
        icon: <TrashIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidate();
    }
  };

  return (
    <div className="mb-4 w-full">
      <div className="flex flex-col justify-between lg:flex-row lg:items-end">
        <Header
          subtext={subtextItems?.reduce((prev, curr) => (
            <div className="flex space-x-2">
              {prev} <span>|</span> {curr}
            </div>
          ))}
        >
          <FormattedMessage
            id="common.notifications"
            defaultMessage="Notifications"
          />
        </Header>
        <div className="mt-2 flex grow flex-col sm:flex-row lg:grow-0">
          <div className="mb-2 flex grow sm:mr-2 sm:mb-0 lg:grow-0">
            <span className="border-primary bg-base-100 text-primary-content inline-flex cursor-default items-center rounded-l-md border border-r-0 px-3 text-sm">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              value={currentFilter}
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
              }}
              className="select select-sm select-primary w-full flex-1 rounded-l-none capitalize"
            >
              <option value="all">
                <FormattedMessage id="common.all" defaultMessage="All" />
              </option>
              <option value="unread">
                <FormattedMessage id="common.unread" defaultMessage="unread" />
              </option>
              <option value="read">
                <FormattedMessage id="common.read" defaultMessage="read" />
              </option>
            </select>
          </div>
          {currentHasPermission(
            [Permission.CREATE_NOTIFICATIONS, Permission.MANAGE_NOTIFICATIONS],
            { type: 'or' }
          ) && (
            <Button
              id="send-notification"
              onClick={() => {
                setEditNotificationModal({ open: true, notification: null });
              }}
              buttonSize="sm"
              buttonType="primary"
              disabled={!notificationSettings?.inAppEnabled}
            >
              <FormattedMessage
                id="common.sendNotification"
                defaultMessage="Send Notification"
              />
            </Button>
          )}
        </div>
      </div>
      <NotificationModal
        notification={editNotificationModal.notification}
        onClose={() =>
          setEditNotificationModal({ open: false, notification: null })
        }
        onSave={() => {
          setEditNotificationModal({ open: false, notification: null });
          revalidate();
        }}
        show={editNotificationModal.open}
      />
      {!notificationSettings?.inAppEnabled && (
        <div className="mt-4">
          <Alert
            type="warning"
            title={intl.formatMessage({
              id: 'notification.inAppDisabled',
              defaultMessage: 'In App Notifications Disabled',
            })}
          >
            <p className="text-sm leading-5">
              <FormattedMessage
                id="notification.signUpDisabledMessage"
                defaultMessage="The admin has currently disabled in-app notifications."
              />
            </p>
          </Alert>
        </div>
      )}
      <ul id="notification-list" className="mt-4 flex flex-col gap-1">
        {!data && !error && <LoadingEllipsis />}
        {notificationSettings?.inAppEnabled &&
          data?.results.map((notification) => {
            return (
              <NotificationCard
                key={`notification-list-${notification?.id}`}
                onDelete={() =>
                  deleteNotification(notification.id, String(user?.id))
                }
                onRead={() =>
                  readNotification(
                    notification.id,
                    String(user?.id),
                    !notification.isRead
                  )
                }
                notification={notification}
              />
            );
          })}
      </ul>
      {notificationSettings?.inAppEnabled && data?.results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 md:w-full">
          <span className="text-base">
            <FormattedMessage
              id="common.noResults"
              defaultMessage="No Results"
            />
          </span>
          {currentFilter !== Filter.ALL && (
            <div className="mt-4">
              <Button
                buttonSize="sm"
                buttonType="primary"
                onClick={() => setCurrentFilter(Filter.ALL)}
              >
                <FormattedMessage
                  id="common.showAll"
                  defaultMessage="Show All"
                />
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="border-primary mt-8 mb-4 border-t pt-5">
        <nav
          className="flex flex-col items-center space-y-3 space-x-4 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {notificationSettings?.inAppEnabled &&
                (data?.results.length ?? 0) > 0 && (
                  <FormattedMessage
                    id="common.showingResults"
                    defaultMessage="Showing {start} to {end} of {total} results"
                    values={{
                      start: pageIndex * currentPageSize + 1,
                      end:
                        (data?.results.length ?? 0) < currentPageSize
                          ? pageIndex * currentPageSize +
                            (data?.results.length ?? 0)
                          : (pageIndex + 1) * currentPageSize,
                      total: data?.pageInfo.results ?? 0,
                    }}
                  />
                )}
            </p>
          </div>
          <div className="flex justify-center sm:flex-1 sm:justify-start md:justify-center">
            <span className="-mt-3 items-center text-sm sm:mt-0 sm:-ml-4 md:ml-0">
              <FormattedMessage
                id="common.resultsDisplay"
                defaultMessage="Display {select} results per page"
                values={{
                  select: (
                    <select
                      id="pageSize"
                      name="pageSize"
                      onChange={(e) => {
                        setCurrentPageSize(Number(e.target.value));
                      }}
                      value={currentPageSize}
                      className="select select-sm select-primary mx-1 w-auto min-w-16 shrink-0"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  ),
                }}
              />
            </span>
          </div>
          <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
            <Button
              buttonSize="sm"
              buttonType="primary"
              disabled={!hasPrevPage || !notificationSettings?.inAppEnabled}
              onClick={() => updateQueryParams('page', (page - 1).toString())}
            >
              <ChevronLeftIcon className="size-5" />
              <span>
                <FormattedMessage
                  id="common.previous"
                  defaultMessage="Previous"
                />
              </span>
            </Button>
            <Button
              buttonSize="sm"
              buttonType="primary"
              disabled={!hasNextPage || !notificationSettings?.inAppEnabled}
              onClick={() => updateQueryParams('page', (page + 1).toString())}
            >
              <span>
                <FormattedMessage id="common.next" defaultMessage="Next" />
              </span>
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
};
export default NotificationsList;
