'use client';
import { NotificationContext } from '@app/context/NotificationContext';
import useClickOutside from '@app/hooks/useClickOutside';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import moment from 'moment';
import { usePathname } from 'next/navigation';
import { useContext, useRef } from 'react';

interface NotificationCardProps {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  createdDate?: Date;
}

const NotificationCard = ({ icon, title, children, createdDate }) => {
  return (
    <div className="flex p-2 space-y-1 flex-col bg-base-100 text-white bg-opacity-80 w-full rounded-md relative">
      <div className="flex items-center">
        {icon}
        <span className="font-bold ml-1 w-full pr-2">{title}</span>
        <button className="p-1 m-1 rounded-md focus:outline-none focus:ring-2 focus:ring-error-content hover:opacity-70 bg-error">
          <TrashIcon className="size-4" />
        </button>
      </div>
      <div className="w-full">{children}</div>
      <div className="self-end">
        <span className="text-neutral-300 text-sm">
          {moment(createdDate).fromNow()}
        </span>
      </div>
    </div>
  );
};

const currentNotifications: NotificationCardProps[] = [
  {
    icon: <InformationCircleIcon className="size-6 text-error" />,
    title: 'Update available',
    children: <p>New version 0.0.12 available!</p>,
    createdDate: moment('2024-11-21').toDate(),
  },
  {
    icon: <ExclamationTriangleIcon className="size-6 text-warning" />,
    title: 'Update available',
    children: <p>New version 0.0.10 available!</p>,
    createdDate: moment('2024-10-21').toDate(),
  },
];

const Notifications = () => {
  const { isOpen, setIsOpen } = useContext(NotificationContext);
  const ref = useRef();
  const pathname = usePathname();
  useClickOutside(ref, () => setIsOpen(false));

  return (
    <Transition show={isOpen || false}>
      <div
        ref={ref}
        className={`fixed flex flex-col top-0 bottom-0 ${pathname.match(/^\/watch\/web\/index\.html\/?/) && 'max-sm:mb-[3.8rem]'} right-0 z-50 bg-secondary bg-opacity-30 backdrop-blur sm:border-l border-primary w-full sm:max-w-96 max-sm:translate-y-0 sm:translate-x-0 transition-all duration-300 ease-in data-[closed]:max-sm:translate-y-full data-[closed]:sm:translate-x-full`}
      >
        <div className="w-full bg-primary/50 h-20 content-center p-4 flex flex-wrap justify-between items-center">
          <span>
            <h3 className="text-lg font-bold">Notifications</h3>
            <p className="text-sm font-thin text-neutral-300">1 unread</p>
          </span>
          <button
            className="hover:opacity-70 p-1 size-8"
            onClick={() => setIsOpen(false)}
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>
        <div className="m-1 space-y-2 overflow-y-auto">
          {currentNotifications.map((notification, i) => {
            return (
              <NotificationCard
                key={`notification-card-${i}`}
                icon={notification.icon}
                title={notification.title}
                createdDate={notification.createdDate}
              >
                {notification.children}
              </NotificationCard>
            );
          })}
        </div>
      </div>
    </Transition>
  );
};

export default Notifications;
