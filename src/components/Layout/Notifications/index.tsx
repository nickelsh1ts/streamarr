'use client';
import { useNotificationSidebar } from '@app/context/NotificationSidebarContext';
import { useNotifications } from '@app/hooks/useNotifications';
import useClickOutside from '@app/hooks/useClickOutside';
import { Transition, TransitionChild } from '@headlessui/react';
import { Cog8ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  InformationCircleIcon,
  QueueListIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import { useUser } from '@app/hooks/useUser';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import axios from 'axios';
import Toast from '@app/components/Toast';
import { FormattedMessage, useIntl } from 'react-intl';
import { NotificationCard } from '@app/components/NotificationList/NotificationCard';
import Button from '@app/components/Common/Button';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import { useLockBodyScroll } from '@app/hooks/useLockBodyScroll';
import { NotificationSeverity } from '@server/constants/notification';
import type { ToastType } from '@app/components/Toast';

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

  useEffect(() => {
    if (!isOpen) {
      setFilter('all');
      setNewPageSize(5);
      setEarlierPageSize(5);
    }
  }, [isOpen]);

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
          className="fixed inset-0 bg-[#0006] backdrop-blur-sm z-[49]"
          onClick={() => setIsOpen(false)}
        />
      </TransitionChild>
      <TransitionChild>
        <div
          ref={ref}
          className={`fixed flex flex-col top-0 bottom-0 max-sm:pb-14 right-0 z-50 bg-primary/30 backdrop-blur-md sm:border-l border-primary w-full sm:max-w-[30rem] max-sm:translate-y-0 sm:translate-x-0 transition-all duration-300 ease-in data-[closed]:max-sm:translate-y-full data-[closed]:sm:translate-x-full overflow-hidden text-primary-content`}
        >
          <div className="w-full h-20 content-center p-4 flex flex-wrap justify-between items-center gap-2">
            <span>
              <h3 className="text-2xl font-bold">
                <FormattedMessage
                  id="common.notifications"
                  defaultMessage="Notifications"
                />
              </h3>
              <p className="text-sm font-thin text-neutral">
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
                className="text-neutral hover:text-primary-content transition duration-200 p-1 rounded-full"
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
                className="text-neutral hover:text-primary-content p-2 rounded-full transition duration-200"
                onClick={() => setIsOpen(false)}
              >
                <XMarkIcon className="size-6" />
              </button>
            </span>
          </div>
          <div className="m-1 sm:pb-0 flex flex-col h-full overflow-y-auto">
            <div className="mx-3 flex flex-row justify-between mb-2 text-neutral">
              <span className="font-bold text-xl text-primary-content">
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
            <ul className="flex flex-col gap-2 mb-2">
              {!data && !error ? (
                <LoadingEllipsis />
              ) : (data?.results.filter((notification) => {
                  return !notification.isRead;
                }).length ?? 0) === 0 ? (
                <span className="text-center w-full text-neutral">
                  {intl.formatMessage({
                    id: 'notification.noUnread',
                    defaultMessage: 'No unread notifications',
                  })}
                </span>
              ) : (
                data?.results
                  .filter((notification) => {
                    return !notification.isRead;
                  })
                  .slice(
                    0,
                    filter === 'all'
                      ? (data.results.filter(
                          (notification) => notification.isRead
                        ).length ?? 0) > 0
                        ? newPageSize
                        : newPageSize + 10
                      : newPageSize + 10
                  )
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
                            true
                          )
                        }
                        notification={notification}
                      />
                    );
                  })
              )}
              {(data?.results.filter((notification) => !notification.isRead)
                .length ?? 0) >
                ((data?.results.filter((notification) => notification.isRead)
                  .length ??
                  0 > 0) &&
                filter === 'all'
                  ? newPageSize
                  : newPageSize + 10) && (
                <button
                  className="text-center w-full text-neutral-400 hover:text-white hover:bg-primary-content/10 rounded-lg p-2"
                  onClick={() => setNewPageSize(newPageSize + 5)}
                >
                  {intl.formatMessage({
                    id: 'common.viewMore',
                    defaultMessage: 'View More',
                  })}
                </button>
              )}
            </ul>
            {filter === 'all' &&
              (data?.results.filter((notification) => notification.isRead)
                .length ?? 0) > 0 && (
                <div className="flex flex-col">
                  <div className="mb-2 mx-3">
                    <span className="font-bold text-xl">
                      <FormattedMessage
                        id="notification.earlier"
                        defaultMessage="Earlier"
                      />
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {data?.results
                      .filter((notification) => notification.isRead)
                      .slice(0, earlierPageSize)
                      .map((notification) => {
                        return (
                          <NotificationCard
                            key={`notification-card-${notification.id}`}
                            onDelete={() =>
                              deleteNotification(
                                notification.id,
                                String(user.id)
                              )
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
                    {(data?.results.filter(
                      (notification) => notification.isRead
                    ).length ?? 0) > earlierPageSize && (
                      <button
                        className="text-center w-full text-neutral-400 hover:text-white hover:bg-primary-content/10 rounded-lg p-2"
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
