import { useContext, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import {
  NotificationContext,
  type SocketNotificationPayload,
} from '@app/context/NotificationContext';

type NotificationCallback = (notification: SocketNotificationPayload) => void;

interface UseNotificationsOptions {
  /**
   * Controls automatic SWR cache revalidation:
   * - 'new-only': Only revalidate for new notifications (default)
   * - true: Always revalidate
   * - false: Never revalidate automatically
   */
  autoRevalidate?: boolean | 'new-only';
}

/**
 * Subscribe to real-time notification events via WebSocket.
 * Automatically revalidates SWR caches based on notification type.
 *
 * @example
 * useNotifications();
 *
 * @example
 * useNotifications((notification) => {
 *   Toast({ title: notification.subject });
 * });
 */
export const useNotifications = (
  onNewNotification?: NotificationCallback,
  options: UseNotificationsOptions = {}
): void => {
  const { autoRevalidate = 'new-only' } = options;
  const { subscribe } = useContext(NotificationContext);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    return subscribe((notification) => {
      const shouldRevalidate =
        autoRevalidate === true ||
        (autoRevalidate === 'new-only' && !notification.action);

      if (shouldRevalidate) {
        mutate(
          (key) => typeof key === 'string' && key.includes('/notifications')
        );
      }

      onNewNotification?.(notification);
    });
  }, [subscribe, mutate, onNewNotification, autoRevalidate]);
};
