'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Header from '@app/components/Common/Header';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { useNotifications } from '@app/hooks/useNotifications';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import { usePathname, useSearchParams, useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import { NotificationCard } from '@app/components/NotificationList/NotificationCard';
import Toast from '@app/components/Toast';
import axios from 'axios';
import NotificationModal from '@app/components/NotificationList/NotificationModal';
import type Notification from '@server/entity/Notification';

enum Filter {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

const NotificationsList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSettings } = useSettings();
  const searchParams = useSearchParams();
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(userQuery?.userid),
  });
  const { user: currentUser, hasPermission: currentHasPermission } = useUser();
  const intl = useIntl();
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.ALL);
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

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

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('nl-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter);
      setCurrentPageSize(filterSettings.currentPageSize);
    }

    // If filter value is provided in query, use that instead
    if (Object.values(Filter).includes(searchParams.get('filter') as Filter)) {
      setCurrentFilter(searchParams.get('filter') as Filter);
    }
  }, [searchParams]);

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

  const subtextItems = user?.id != currentUser?.id ? null : null;

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
    <div className="w-full self-center mb-4">
      <div className="flex flex-col justify-between lg:flex-row lg:items-end">
        <Header
          subtext={subtextItems?.reduce((prev, curr) => (
            <div className="flex space-x-2">
              {prev} <span>|</span> {curr}
            </div>
          ))}
        >
          <FormattedMessage
            id="notification.header"
            defaultMessage="Notifications"
          />
        </Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              value={currentFilter}
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
              }}
              className="select select-sm select-primary rounded-l-none w-full flex-1"
            >
              <option value="all">
                <FormattedMessage id="common.all" defaultMessage="All" />
              </option>
              <option value="unread">
                <FormattedMessage id="common.unread" defaultMessage="Unread" />
              </option>
              <option value="read">
                <FormattedMessage id="common.read" defaultMessage="Read" />
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
              disabled={!currentSettings?.inAppEnabled}
            >
              <FormattedMessage
                id="notification.sendNotification"
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
      {!currentSettings?.inAppEnabled && (
        <div className="mt-4">
          <Alert
            type="warning"
            title={intl.formatMessage({
              id: 'notification.inAppDisabled',
              defaultMessage: 'In App Notifications Disabled',
            })}
          >
            <p className="sm:ml-3 text-sm leading-5">
              <FormattedMessage
                id="notification.signUpDisabledMessage"
                defaultMessage="The admin has currently disabled in-app notifications."
              />
            </p>
          </Alert>
        </div>
      )}
      <ul id="notification-list" className="flex flex-col gap-4 mt-4 max-w-lg">
        {!data && !error && <LoadingEllipsis />}
        {currentSettings?.inAppEnabled &&
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
      {currentSettings?.inAppEnabled && data?.results.length === 0 && (
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
      <div className="mt-8 mb-4 border-t border-primary pt-5">
        <nav
          className="flex flex-col items-center space-x-4 space-y-3 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {currentSettings?.inAppEnabled &&
                (data?.results.length ?? 0) > 0 && (
                  <FormattedMessage
                    id="common.showingResults"
                    defaultMessage="Showing {start} to {end} of {total} results"
                    values={{
                      start: pageIndex * currentPageSize + 1,
                      end:
                        (data?.results.length ?? 0 < currentPageSize)
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
            <span className="-mt-3 items-center text-sm sm:-ml-4 sm:mt-0 md:ml-0">
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
                      className="select select-sm select-primary mx-1"
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
              disabled={!hasPrevPage || !currentSettings?.inAppEnabled}
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
              disabled={!hasNextPage || !currentSettings?.inAppEnabled}
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
