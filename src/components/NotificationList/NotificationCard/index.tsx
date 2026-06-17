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
import type React from 'react';
import { useCallback, useRef } from 'react';
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
          className="absolute top-0 right-0 bottom-0 flex items-stretch"
          style={{
            transform: `translateX(${REVEAL_WIDTH + offsetX}px)`,
            transition: !isSwiping ? 'transform 200ms ease-out' : undefined,
          }}
        >
          <button
            className={`flex w-14 items-center justify-center ${notification.isRead ? 'bg-warning/40' : 'bg-info/40'}`}
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
            className="bg-error/40 flex w-14 items-center justify-center"
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
        className={`text-primary-content flex w-full gap-3 p-2 ${isTouch ? '' : 'rounded-lg'} relative text-start ${!notification.isRead ? 'bg-primary/20 ring-primary/20 ring-1 ring-inset' : ''} hover:bg-primary-content/10 group/item hover:cursor-pointer`}
        {...(isTouch ? handlers : {})}
      >
        <div className="border-primary-content relative mb-2 inline-flex size-16 shrink-0 items-center justify-center rounded-full border shadow-md">
          <div>
            <CachedImage
              src={
                notification?.createdBy?.id
                  ? `/avatarproxy/${notification.createdBy.id}`
                  : logoSmallSrc
              }
              alt=""
              className="rounded-full"
              width={64}
              height={64}
            />
          </div>
          <div
            className={`absolute right-0 bottom-0 -me-1 -mb-1 size-7 rounded-full p-1 ${bgColor}`}
          >
            {icon}
          </div>
        </div>
        <div className="flex w-full flex-col place-content-center items-start">
          <span className="w-full pr-2 font-bold">{notification.subject}</span>
          <span>{notification.message}</span>
          <span
            className={`${!notification.isRead ? 'text-primary' : ''} text-xs font-bold`}
          >
            {moment(notification.createdAt).fromNow()}
          </span>
          {notification.actionUrlTitle && notification.actionUrl && (
            <div className="mt-2 flex w-full max-w-md gap-2">
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
          <div className="-ml-6 content-center p-2">
            <div className="relative size-4">
              {!notification.isRead && (
                <>
                  <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                  <span className="bg-primary relative mb-1 inline-flex size-4 rounded-full"></span>
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
                className="hover:bg-base-200 actions text-neutral hover:text-base-content rounded-full p-1 hover:cursor-pointer"
              >
                <DropDownMenu.Item
                  onClick={(e) => {
                    onRead?.();
                    e.stopPropagation();
                  }}
                >
                  <ClipboardDocumentListIcon className="mr-1 size-5" />
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
                  <TrashIcon className="text-error mr-1 size-5" />
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
