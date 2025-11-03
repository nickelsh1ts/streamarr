import DropDownMenu from '@app/components/Common/DropDownMenu';
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
  const router = useRouter();
  const intl = useIntl();
  let icon = <InformationCircleIcon className="text-primary" />;

  switch (notification.severity) {
    case NotificationSeverity.ERROR:
      icon = <XCircleIcon className="text-error" />;
      break;
    case NotificationSeverity.WARNING:
      icon = <ExclamationTriangleIcon className="text-warning" />;
      break;
    case NotificationSeverity.INFO:
      icon = <InformationCircleIcon className="text-primary" />;
      break;
    case NotificationSeverity.SUCCESS:
      icon = <CheckBadgeIcon className="text-success" />;
      break;
    case NotificationSeverity.SECONDARY:
      icon = <InformationCircleIcon className="text-secondary" />;
      break;
    case NotificationSeverity.ACCENT:
      icon = <InformationCircleIcon className="text-accent" />;
      break;
    default:
      icon = <InformationCircleIcon className="text-primary" />;
  }

  return (
    <div
      onClick={() => {
        if (notification.actionUrl) {
          router.push(notification.actionUrl);
        }
        onRead();
      }}
      onKeyDown={() => {
        if (notification.actionUrl) {
          router.push(notification.actionUrl);
        }
        onRead();
      }}
      role="button"
      tabIndex={0}
      className="flex gap-3 p-2 text-white w-full rounded-lg relative text-start hover:bg-primary-content/10 group/item has-[.actions:hover]:bg-transparent"
    >
      <div className="relative inline-flex size-16 flex-shrink-0 items-center justify-center rounded-full border border-base-200 bg-white shadow-md">
        {icon}
      </div>
      <div className="flex flex-col items-start">
        <span className="font-bold w-full pr-2">{notification.subject}</span>
        <div className="w-full flex flex-row gap-1 justify-between">
          <span className="">{notification.message}</span>
          <div className="flex flex-row gap-2 items-center -my-2">
            <div className="content-center">
              <DropDownMenu
                chevron={false}
                size="md"
                dropdownIcon={<EllipsisHorizontalIcon className="size-7" />}
                className="-mx-2 p-1 rounded-full invisible shadow-md bg-base-100 hover:bg-[#202629] group-hover/item:visible actions border border-base-200"
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
            {!notification.isRead && (
              <div className="p-2 content-center">
                <div className="relative size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex size-4 rounded-full bg-primary mb-1"></span>
                </div>
              </div>
            )}
          </div>
        </div>
        <span className="text-primary text-sm">
          {moment(notification.createdAt).fromNow()}
        </span>
      </div>
    </div>
  );
};
