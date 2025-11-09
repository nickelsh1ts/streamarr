'use client';
import { createContext, useContext, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface NotificationSidebarContextProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const NotificationSidebarContext =
  createContext<NotificationSidebarContextProps>({
    isOpen: false,
    setIsOpen: () => {},
  });

export const NotificationSidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </NotificationSidebarContext.Provider>
  );
};

export const useNotificationSidebar = () =>
  useContext(NotificationSidebarContext);
