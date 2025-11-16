'use client';
import { createContext, useEffect, useRef } from 'react';
import { socket } from '@app/utils/webSocket';
import type { NotificationType } from '@server/constants/notification';
import type { NotificationSeverity } from '@server/constants/notification';

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

  const subscribe = (callback: NotificationCallback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  };

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
