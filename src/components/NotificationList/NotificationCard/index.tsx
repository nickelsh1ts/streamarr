import Button from '@app/components/Common/Button';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import { useNotificationSidebar } from '@app/context/NotificationSidebarContext';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import {
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { NotificationSeverity } from '@server/constants/notification';
import type Notification from '@server/entity/Notification';
import moment from 'moment';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

interface NotificationCardProps {
  notification: Notification;
  onRead?: () => void;
  onDelete?: () => void;
  onDismiss?: () => void;
}

export const NotificationCard = ({
  notification,
  onRead,
  onDelete,
}: NotificationCardProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { setIsOpen } = useNotificationSidebar();
  let icon = <InformationCircleIcon className="text-primary-content" />;
  let bgColor = 'bg-primary';

  switch (notification.severity) {
    case NotificationSeverity.ERROR:
      icon = <XCircleIcon className="text-error-content" />;
      bgColor = 'bg-error';
      break;
    case NotificationSeverity.WARNING:
      icon = <ExclamationTriangleIcon className="text-warning-content" />;
      bgColor = 'bg-warning';
      break;
    case NotificationSeverity.INFO:
      icon = <InformationCircleIcon className="text-primary-content" />;
      bgColor = 'bg-primary';
      break;
    case NotificationSeverity.SUCCESS:
      icon = <CheckBadgeIcon className="text-success-content" />;
      bgColor = 'bg-success';
      break;
    case NotificationSeverity.SECONDARY:
      icon = <InformationCircleIcon className="text-secondary-content" />;
      bgColor = 'bg-secondary';
      break;
    case NotificationSeverity.ACCENT:
      icon = <InformationCircleIcon className="text-accent-content" />;
      bgColor = 'bg-accent';
      break;
    default:
      icon = <InformationCircleIcon className="text-primary-content" />;
      bgColor = 'bg-primary';
  }

  return (
    <div
      onClick={() => {
        !notification.isRead && onRead();
        if (notification.actionUrl) {
          setIsOpen(false);
          router.push(notification.actionUrl);
        }
      }}
      onKeyDown={() => {
        !notification.isRead && onRead();
        if (notification.actionUrl) {
          setIsOpen(false);
          router.push(notification.actionUrl);
        }
      }}
      role="button"
      tabIndex={0}
      className={`flex gap-3 p-2 text-white w-full rounded-lg relative text-start ${!notification.isRead ? 'bg-primary/20' : ''} hover:bg-primary-content/10 group/item has-[.actions:hover]:bg-transparent`}
    >
      <div className="relative inline-flex size-16 flex-shrink-0 items-center justify-center rounded-full border border-base-200 shadow-md mb-2">
        <div>
          <Image
            src={'/streamarr-logo-192x192.png'}
            alt=""
            className="rounded-full"
            width={64}
            height={64}
          />
        </div>
        <div
          className={`absolute rounded-full size-7 right-0 bottom-0 -me-1 -mb-2 p-1 ${bgColor}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex flex-col items-start w-full place-content-center">
        <span className="font-bold w-full pr-2">{notification.subject}</span>
        <div className="w-full flex flex-row gap-1 justify-between">
          <span className="">{notification.message}</span>
        </div>
        <span
          className={`${!notification.isRead ? 'text-primary' : ''} text-sm font-extrabold`}
        >
          {moment(notification.createdAt).fromNow(true)}
        </span>
        {notification.actionUrlTitle && notification.actionUrl && (
          <div className="flex gap-2 mt-2 w-full max-w-md">
            <Button
              buttonSize="sm"
              buttonType="primary"
              className="flex-1"
              onClick={() => {
                setIsOpen(false);
                router.push(notification.actionUrl);
              }}
            >
              {notification?.actionUrlTitle}
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-1 items-center">
        <div className="p-2 content-center">
          <div className="relative size-4">
            {!notification.isRead && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-4 rounded-full bg-primary mb-1"></span>
              </>
            )}
          </div>
        </div>
        <div className="content-center">
          <DropDownMenu
            chevron={false}
            size="md"
            dropdownIcon={<EllipsisHorizontalIcon className="size-7" />}
            className="p-1 rounded-full hover:bg-[#202629] actions"
          >
            <DropDownMenu.Item
              onClick={(e) => {
                onRead();
                e.stopPropagation();
              }}
            >
              <ClipboardDocumentListIcon className="size-5 mr-1" />
              <FormattedMessage
                id="notification.markAsRead"
                defaultMessage="Mark as {isRead}"
                values={{
                  isRead: !notification.isRead
                    ? intl.formatMessage({
                        id: 'common.read',
                        defaultMessage: 'read',
                      })
                    : intl.formatMessage({
                        id: 'common.unread',
                        defaultMessage: 'unread',
                      }),
                }}
              />
            </DropDownMenu.Item>
            <DropDownMenu.Item
              onClick={(e) => {
                onDelete();
                e.stopPropagation();
              }}
            >
              <TrashIcon className="size-5 text-error mr-1" />
              <FormattedMessage
                id="notification.deleteThis"
                defaultMessage="Delete this notification"
              />
            </DropDownMenu.Item>
          </DropDownMenu>
        </div>
      </div>
    </div>
  );
};
