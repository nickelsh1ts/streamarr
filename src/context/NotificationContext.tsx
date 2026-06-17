'use client';
import { socket } from '@app/utils/webSocket';
import type {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import { createContext, useCallback, useEffect, useRef } from 'react';

export interface SocketNotificationPayload {
  type?: NotificationType;
  subject?: string;
  severity?: NotificationSeverity;
  description?: string;
  message?: string;
  inviteId?: number;
  actionUrl?: string;
  actionUrlTitle?: string;
  action?: 'updated' | 'deleted' | 'bulkUpdated';
  id?: number;
  isRead?: boolean;
}

type NotificationCallback = (notification: SocketNotificationPayload) => void;

interface NotificationContextProps {
  subscribe: (callback: NotificationCallback) => () => void;
}

export const NotificationContext = createContext<NotificationContextProps>({
  subscribe: () => () => {},
});

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const listenersRef = useRef(new Set<NotificationCallback>());

  const subscribe = useCallback((callback: NotificationCallback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  useEffect(() => {
    const handleNewNotification = (notification: SocketNotificationPayload) => {
      listenersRef.current.forEach((callback) => callback(notification));
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ subscribe }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
