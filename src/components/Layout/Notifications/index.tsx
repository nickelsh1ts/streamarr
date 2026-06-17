'use client';
import Button from '@app/components/Common/Button';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { NotificationCard } from '@app/components/NotificationList/NotificationCard';
import Toast, { type ToastType } from '@app/components/Toast';
import { useNotificationSidebar } from '@app/context/NotificationSidebarContext';
import useClickOutside from '@app/hooks/useClickOutside';
import { useLockBodyScroll } from '@app/hooks/useLockBodyScroll';
import { useNotifications } from '@app/hooks/useNotifications';
import { useUser } from '@app/hooks/useUser';
import { Transition, TransitionChild } from '@headlessui/react';
import { Cog8ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  QueueListIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { NotificationSeverity } from '@server/constants/notification';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import axios from 'axios';
import { useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { useSWRConfig } from 'swr';

export const getToastType = (severity: NotificationSeverity): ToastType => {
  switch (severity) {
    case NotificationSeverity.ERROR:
      return 'error';
    case NotificationSeverity.WARNING:
      return 'warning';
    case NotificationSeverity.SUCCESS:
      return 'success';
    case NotificationSeverity.INFO:
      return 'info';
    case NotificationSeverity.PRIMARY:
      return 'primary';
    case NotificationSeverity.SECONDARY:
      return 'secondary';
    case NotificationSeverity.ACCENT:
      return 'accent';
    default:
      return 'default';
  }
};

const Notifications = () => {
  const { user } = useUser();
  const intl = useIntl();
  const { isOpen, setIsOpen } = useNotificationSidebar();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [newPageSize, setNewPageSize] = useState<number>(5);
  const [earlierPageSize, setEarlierPageSize] = useState<number>(5);
  const ref = useRef<HTMLDivElement>(null);
  const { mutate: revalidate } = useSWRConfig();
  useClickOutside(ref, () => setIsOpen(false));
  useLockBodyScroll(isOpen);

  const { data, error } = useSWR<NotificationResultsResponse>(
    user ? `/api/v1/user/${user?.id}/notifications` : null
  );

  useNotifications(
    (notification) => {
      if (!notification?.action) {
        Toast({
          title:
            notification.subject ||
            intl.formatMessage({
              id: 'notification.newReceived',
              defaultMessage: 'New Notification Received',
            }),
          type: getToastType(notification.severity),
          icon: <InformationCircleIcon className="size-7" />,
          message: notification.description,
        });
      }
    },
    { autoRevalidate: false }
  );

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
        message: e.response?.data?.message || e.message,
      });
      throw e;
    } finally {
      revalidate(
        (key) => typeof key === 'string' && key.includes('/notifications')
      );
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
        message: e.response?.data?.message || e.message,
      });
    } finally {
      revalidate(
        (key) => typeof key === 'string' && key.includes('/notifications')
      );
    }
  };

  const readAllNotifications = async (userId: string) => {
    try {
      await axios.put(`/api/v1/user/${userId}/notifications`, {
        isRead: true,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'notification.readAllError',
          defaultMessage: 'Error marking all notifications as read',
        }),
        type: 'error',
        icon: <TrashIcon className="size-7" />,
        message: e.response?.data?.message || e.message,
      });
    } finally {
      revalidate(
        (key) => typeof key === 'string' && key.includes('/notifications')
      );
    }
  };

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setFilter('all');
      setNewPageSize(5);
      setEarlierPageSize(5);
    }
  }

  const unreadNotifications = useMemo(
    () => data?.results.filter((notification) => !notification.isRead) ?? [],
    [data]
  );
  const readNotifications = useMemo(
    () => data?.results.filter((notification) => notification.isRead) ?? [],
    [data]
  );
  // When filtering on "all" and there are read notifications shown below, keep
  // the New section compact; otherwise allow it to show more before paginating.
  const newLimit =
    filter === 'all' && readNotifications.length > 0
      ? newPageSize
      : newPageSize + 10;

  return (
    <Transition show={isOpen || false}>
      <TransitionChild
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <button
          className="fixed inset-0 z-49 bg-[#0006] backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      </TransitionChild>
      <TransitionChild>
        <div
          ref={ref}
          className={`bg-primary/30 border-primary text-primary-content fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col overflow-hidden backdrop-blur-md transition-all duration-300 ease-in max-sm:translate-y-0 max-sm:pb-14 data-closed:max-sm:translate-y-full sm:max-w-120 sm:translate-x-0 sm:border-l data-closed:sm:translate-x-full`}
        >
          <div className="flex h-20 w-full flex-wrap content-center items-center justify-between gap-2 p-4">
            <span>
              <h3 className="text-2xl font-bold">
                <FormattedMessage
                  id="common.notifications"
                  defaultMessage="Notifications"
                />
              </h3>
              <p className="text-neutral text-sm font-thin">
                <Button
                  className={filter === 'all' ? 'btn-active' : ''}
                  buttonSize="sm"
                  buttonType="ghost"
                  onClick={() => setFilter('all')}
                >
                  <FormattedMessage id="common.all" defaultMessage="All" />
                </Button>
                <Button
                  className={`ml-2 ${filter === 'unread' ? 'btn-active' : ''}`}
                  buttonSize="sm"
                  buttonType="ghost"
                  onClick={() => setFilter('unread')}
                >
                  <FormattedMessage
                    id="common.unread"
                    defaultMessage="unread"
                  />
                </Button>
              </p>
            </span>
            <span className="flex flex-row place-content-end gap-4">
              <DropDownMenu
                chevron={false}
                dropdownIcon={<EllipsisHorizontalIcon className="size-8" />}
                className="text-neutral hover:text-primary-content rounded-full p-1 transition duration-200 hover:cursor-pointer"
              >
                <DropDownMenu.Item
                  onClick={() => readAllNotifications(String(user.id))}
                >
                  <CheckIcon className="size-6" />{' '}
                  <FormattedMessage
                    id="notification.markAllAsRead"
                    defaultMessage="Mark all as read"
                  />
                </DropDownMenu.Item>
                <DropDownMenu.Item
                  activeRegEx={/^\/profile\/settings\/notifications\/inapp\/?$/}
                  href="/profile/settings/notifications/inapp"
                  onClick={() => setIsOpen(false)}
                >
                  <Cog8ToothIcon className="size-6" />{' '}
                  <FormattedMessage
                    id="notification.settings"
                    defaultMessage="Notification Settings"
                  />
                </DropDownMenu.Item>
                <DropDownMenu.Item
                  activeRegEx={/^\/profile\/notifications\/?$/}
                  href="/profile/notifications"
                  onClick={() => setIsOpen(false)}
                >
                  <QueueListIcon className="size-6" />{' '}
                  <FormattedMessage
                    id="notification.open"
                    defaultMessage="Open Notifications"
                  />
                </DropDownMenu.Item>
              </DropDownMenu>
              <button
                className="text-neutral hover:text-primary-content rounded-full p-2 transition duration-200 hover:cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <XMarkIcon className="size-6" />
              </button>
            </span>
          </div>
          <div className="m-1 flex h-full flex-col overflow-y-auto sm:pb-0">
            <div className="text-neutral mx-3 mb-2 flex flex-row justify-between">
              <span className="text-primary-content text-xl font-bold">
                {filter === 'unread' ? '' : 'New'}
              </span>
              <Button
                as="link"
                buttonSize="sm"
                buttonType="ghost"
                href="/profile/notifications"
                onClick={() => setIsOpen(false)}
              >
                <FormattedMessage id="common.seeAll" defaultMessage="See all" />
              </Button>
            </div>
            <ul className="mb-2 flex flex-col gap-2">
              {!data && !error ? (
                <LoadingEllipsis />
              ) : unreadNotifications.length === 0 ? (
                <span className="text-neutral w-full text-center">
                  {intl.formatMessage({
                    id: 'notification.noUnread',
                    defaultMessage: 'No unread notifications',
                  })}
                </span>
              ) : (
                unreadNotifications.slice(0, newLimit).map((notification) => {
                  return (
                    <NotificationCard
                      key={`notification-card-${notification.id}`}
                      onDelete={() =>
                        deleteNotification(notification.id, String(user.id))
                      }
                      onRead={() =>
                        readNotification(notification.id, String(user.id), true)
                      }
                      notification={notification}
                    />
                  );
                })
              )}
              {unreadNotifications.length > newLimit && (
                <button
                  className="hover:bg-primary-content/10 w-full rounded-lg p-2 text-center text-neutral-400 hover:cursor-pointer hover:text-white"
                  onClick={() => setNewPageSize(newPageSize + 5)}
                >
                  {intl.formatMessage({
                    id: 'common.viewMore',
                    defaultMessage: 'View More',
                  })}
                </button>
              )}
            </ul>
            {filter === 'all' && readNotifications.length > 0 && (
              <div className="flex flex-col">
                <div className="mx-3 mb-2">
                  <span className="text-xl font-bold">
                    <FormattedMessage
                      id="notification.earlier"
                      defaultMessage="Earlier"
                    />
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {readNotifications
                    .slice(0, earlierPageSize)
                    .map((notification) => {
                      return (
                        <NotificationCard
                          key={`notification-card-${notification.id}`}
                          onDelete={() =>
                            deleteNotification(notification.id, String(user.id))
                          }
                          onRead={() =>
                            readNotification(
                              notification.id,
                              String(user.id),
                              !notification.isRead
                            )
                          }
                          notification={notification}
                        />
                      );
                    })}
                  {readNotifications.length > earlierPageSize && (
                    <button
                      className="hover:bg-primary-content/10 w-full rounded-lg p-2 text-center text-neutral-400 hover:cursor-pointer hover:text-white"
                      onClick={() => setEarlierPageSize(earlierPageSize + 5)}
                    >
                      {intl.formatMessage({
                        id: 'common.viewMore',
                        defaultMessage: 'View More',
                      })}
                    </button>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </TransitionChild>
    </Transition>
  );
};

export default Notifications;
