import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import { useNotificationSidebar } from '@app/context/NotificationSidebarContext';
import useSettings from '@app/hooks/useSettings';
import { useSwipeToDismiss } from '@app/hooks/useSwipeToDismiss';
import {
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
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
import { useCallback, useRef } from 'react';
import type React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const REVEAL_WIDTH = 112;

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { icon: React.ReactNode; bgColor: string }
> = {
  [NotificationSeverity.ERROR]: {
    icon: <XCircleIcon className="text-error-content" />,
    bgColor: 'bg-error',
  },
  [NotificationSeverity.WARNING]: {
    icon: <ExclamationTriangleIcon className="text-warning-content" />,
    bgColor: 'bg-warning',
  },
  [NotificationSeverity.INFO]: {
    icon: <InformationCircleIcon className="text-info-content" />,
    bgColor: 'bg-info',
  },
  [NotificationSeverity.SUCCESS]: {
    icon: <CheckBadgeIcon className="text-success-content" />,
    bgColor: 'bg-success',
  },
  [NotificationSeverity.SECONDARY]: {
    icon: <InformationCircleIcon className="text-secondary-content" />,
    bgColor: 'bg-secondary',
  },
  [NotificationSeverity.ACCENT]: {
    icon: <InformationCircleIcon className="text-accent-content" />,
    bgColor: 'bg-accent',
  },
  [NotificationSeverity.PRIMARY]: {
    icon: <InformationCircleIcon className="text-primary-content" />,
    bgColor: 'bg-primary',
  },
};

interface NotificationCardProps {
  notification: Notification;
  onRead?: () => void;
  onDelete?: () => Promise<void>;
}

export const NotificationCard = ({
  notification,
  onRead,
  onDelete,
}: NotificationCardProps) => {
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const router = useRouter();
  const { setIsOpen } = useNotificationSidebar();
  const pendingAction = useRef<(() => void | Promise<void>) | null>(null);

  const {
    containerRef,
    offsetX,
    isRevealed,
    isSwiping,
    isDismissing,
    isTouch,
    handlers,
    close,
    dismiss,
    resetDismiss,
  } = useSwipeToDismiss({
    id: notification.id,
    revealWidth: REVEAL_WIDTH,
  });

  const handleTransitionEnd = useCallback(async () => {
    if (isDismissing && pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      try {
        await action();
      } catch {
        resetDismiss();
      }
    }
  }, [isDismissing, resetDismiss]);

  const handleActivate = useCallback(() => {
    if (isSwiping || isDismissing) return;
    if (isRevealed) {
      close();
      return;
    }
    if (!notification.isRead) onRead?.();
    if (notification.actionUrl && !notification.actionUrlTitle) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  }, [
    isSwiping,
    isDismissing,
    isRevealed,
    close,
    notification,
    onRead,
    setIsOpen,
    router,
  ]);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      handleActivate();
    },
    [handleActivate]
  );

  const { icon, bgColor } =
    SEVERITY_CONFIG[notification.severity] ??
    SEVERITY_CONFIG[NotificationSeverity.PRIMARY];

  const logoSmallSrc =
    currentSettings.customLogoSmall || '/streamarr-logo-512x512.png';

  return (
    <div
      ref={containerRef}
      className={`relative ${isTouch ? 'overflow-hidden rounded-lg' : ''} ${
        isDismissing
          ? '-translate-x-full opacity-0 transition-all duration-300 ease-in'
          : ''
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {isTouch && !isDismissing && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-stretch"
          style={{
            transform: `translateX(${REVEAL_WIDTH + offsetX}px)`,
            transition: !isSwiping ? 'transform 200ms ease-out' : undefined,
          }}
        >
          <button
            className={`w-14 flex items-center justify-center ${notification.isRead ? 'bg-warning/40' : 'bg-info/40'}`}
            onClick={(e) => {
              e.stopPropagation();
              close();
              onRead?.();
            }}
            aria-label={intl.formatMessage({
              id: 'common.read',
              defaultMessage: 'read',
            })}
          >
            {notification.isRead ? (
              <EnvelopeIcon className="size-5 text-white" />
            ) : (
              <EnvelopeOpenIcon className="size-5 text-white" />
            )}
          </button>
          <button
            className="w-14 flex items-center justify-center bg-error/40"
            onClick={(e) => {
              e.stopPropagation();
              pendingAction.current = () => onDelete?.();
              dismiss();
            }}
            aria-label={intl.formatMessage({
              id: 'notification.deleteThis',
              defaultMessage: 'Delete this notification',
            })}
          >
            <TrashIcon className="size-5 text-white" />
          </button>
        </div>
      )}
      <div
        onClick={handleActivate}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
        style={
          isTouch && !isDismissing
            ? {
                transform: `translateX(${offsetX}px)`,
                transition: !isSwiping ? 'transform 200ms ease-out' : undefined,
              }
            : undefined
        }
        className={`flex gap-3 p-2 text-primary-content w-full ${isTouch ? '' : 'rounded-lg'} relative text-start ${!notification.isRead ? 'bg-primary/20 ring-1 ring-inset ring-primary/20' : ''} hover:bg-primary-content/10 group/item`}
        {...(isTouch ? handlers : {})}
      >
        <div className="relative inline-flex size-16 flex-shrink-0 items-center justify-center rounded-full border border-primary-content shadow-md mb-2">
          <div>
            <CachedImage
              src={notification?.createdBy?.avatar || logoSmallSrc}
              alt=""
              className="rounded-full"
              width={64}
              height={64}
            />
          </div>
          <div
            className={`absolute rounded-full size-7 right-0 bottom-0 -me-1 -mb-1 p-1 ${bgColor}`}
          >
            {icon}
          </div>
        </div>
        <div className="flex flex-col items-start w-full place-content-center">
          <span className="font-bold w-full pr-2">{notification.subject}</span>
          <span>{notification.message}</span>
          <span
            className={`${!notification.isRead ? 'text-primary' : ''} text-xs font-bold`}
          >
            {moment(notification.createdAt).fromNow()}
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
        <div className="flex flex-row items-center">
          <div className="p-2 content-center -ml-6">
            <div className="relative size-4">
              {!notification.isRead && (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex size-4 rounded-full bg-primary mb-1"></span>
                </>
              )}
            </div>
          </div>
          {!isTouch && (
            <div className="content-center">
              <DropDownMenu
                chevron={false}
                size="md"
                dropdownIcon={<EllipsisHorizontalIcon className="size-7" />}
                className="p-1 rounded-full hover:bg-base-200 actions text-neutral hover:text-base-content"
              >
                <DropDownMenu.Item
                  onClick={(e) => {
                    onRead?.();
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
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onDelete?.();
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
          )}
        </div>
      </div>
    </div>
  );
};
