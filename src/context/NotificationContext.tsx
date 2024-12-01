'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useState } from 'react';

interface NotificationsContextProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}
export const NotificationContext = createContext<NotificationsContextProps>({
  isOpen: false,
} as NotificationsContextProps);

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <NotificationContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
