import { withProperties } from '@app/utils/typeHelpers';
// import { NotificationSeverity } from '@server/constants/notification';
import type Notification from '@server/entity/Notification';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { NotificationSeverity } from '@server/constants/notification';
// import { useIntl } from 'react-intl';

const NotificationCardPlaceholder = () => {
  return (
    <div className="relative w-80 animate-pulse rounded-xl bg-primary/50 backdrop-blur-md p-4 border border-primary">
      <div className="w-24 sm:w-24">
        <div className="w-full" style={{ paddingBottom: '100%' }} />
      </div>
    </div>
  );
};

interface RecentNotificationProps {
  notification?: Notification;
}

const RecentNotification = ({ notification }: RecentNotificationProps) => {
  let icon;
  switch (notification.severity) {
    case NotificationSeverity.ERROR:
      icon = <XCircleIcon className="text-error" />;
      break;
    case NotificationSeverity.WARNING:
      icon = <ExclamationTriangleIcon className="text-warning" />;
      break;
    case NotificationSeverity.INFO:
      icon = <InformationCircleIcon className="text-info" />;
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
      className={`w-80 h-32 border border-primary bg-base-100 p-4 rounded-xl content-center relative`}
    >
      <div className="absolute top-0 right-0 m-2 size-7">{icon}</div>
      <div>
        <p className="truncate text-sm font-semibold me-6">
          {notification?.subject}
        </p>
        <div className="w-full h-full">
          <p className="py-1 leading-5 whitespace-normal line-clamp-3">
            {notification?.message}
          </p>
        </div>
        <p className="text-xs text-end truncate w-full text-neutral">
          {moment(notification?.createdAt).fromNow()}
        </p>
      </div>
    </div>
  );
};

export default withProperties(RecentNotification, {
  Placeholder: NotificationCardPlaceholder,
});
