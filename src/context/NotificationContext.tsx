'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useState } from 'react';

//TODO: Look at moving notification data/revalidation here
// Then we can remove SWR from the layout and notification list components
// And only load notifications when the notification sidebar is opened

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
