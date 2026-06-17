import { useInView } from '@app/hooks/useElementInView';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { withProperties } from '@app/utils/typeHelpers';
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { NotificationSeverity } from '@server/constants/notification';
import type Notification from '@server/entity/Notification';
import { useRef } from 'react';

const NotificationCardPlaceholder = () => {
  return (
    <div className="bg-base-200 relative w-72 animate-pulse rounded-xl p-4 sm:w-96">
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
  const ref = useRef(null);
  const isInView = useInView(ref, 0.17);

  if (!notification || !isInView) {
    return (
      <div ref={ref}>
        <NotificationCardPlaceholder />
      </div>
    );
  }

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
      className={`border-primary bg-base-100 relative h-32 w-72 content-center rounded-xl border p-4 sm:w-96`}
    >
      <div className="absolute top-0 right-0 m-2 size-7">{icon}</div>
      <div>
        <p className="me-6 truncate text-sm font-semibold">
          {notification?.subject}
        </p>
        <div className="h-full w-full">
          <p className="line-clamp-3 py-1 leading-5 whitespace-normal">
            {notification?.message}
          </p>
        </div>
        <p className="text-neutral w-full truncate text-end text-xs">
          {moment(notification?.createdAt).fromNow()}
        </p>
      </div>
    </div>
  );
};

export default withProperties(RecentNotification, {
  Placeholder: NotificationCardPlaceholder,
});
