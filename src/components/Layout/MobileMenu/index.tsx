'use client';
import LibraryMenu from '@app/components/Layout/LibraryMenu';
import { RequestMenu } from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import useClickOutside from '@app/hooks/useClickOutside';
import useHash from '@app/hooks/useHash';
import { Transition } from '@headlessui/react';
import {
  Bars3BottomLeftIcon,
  CalendarDateRangeIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  PaperAirplaneIcon as FilledPaperAirplaneIcon,
  CalendarDateRangeIcon as FilledCalendarDateRangeIcon,
  HomeIcon as FilledHomeIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cloneElement, useRef, useState } from 'react';

interface MenuLink {
  href: string;
  svgIcon: JSX.Element;
  svgIconSelected: JSX.Element;
  content: React.ReactNode;
  activeRegExp: RegExp;
  as?: string;
  dataTestId?: string;
}

const MobileMenu = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuType, setMenuType] = useState(null);
  const pathname = usePathname() + useHash();
  useClickOutside(ref, () => {
    setTimeout(() => {
      if (isOpen) {
        setIsOpen(false);
      }
    }, 150);
  });

  const toggle = () => setIsOpen(!isOpen);

  const menuLinks: MenuLink[] = [
    {
      href: '/watch/web/index.html#!',
      content: 'Home',
      svgIcon: <HomeIcon className="size-7" />,
      svgIconSelected: <FilledHomeIcon className="size-7" />,
      activeRegExp: /^\/watch\/web\/index\.html#!\/?$/,
    },
    {
      href: '/request',
      content: 'Request',
      svgIcon: (
        <Image
          alt="Overseerr"
          width={24}
          height={24}
          src={'/external/os-icon.svg'}
        />
      ),
      svgIconSelected: (
        <Image
          alt="Overseerr"
          width={24}
          height={24}
          src={'/external/os-icon.svg'}
        />
      ),
      activeRegExp: /^\/request\/?$/,
    },
    {
      href: '/invites',
      content: 'Invite',
      svgIcon: <PaperAirplaneIcon className="h-6 w-6" />,
      svgIconSelected: <FilledPaperAirplaneIcon className="h-6 w-6" />,
      activeRegExp: /^\/invites\/?/,
    },
    {
      href: '/schedule',
      content: 'Schedule',
      svgIcon: <CalendarDateRangeIcon className="h-6 w-6" />,
      svgIconSelected: <FilledCalendarDateRangeIcon className="h-6 w-6" />,
      activeRegExp: /^\/schedule\/?/,
    },
  ];

  const settingsLinks: MenuLink[] = [
    {
      href: '/watch/web/index.html#!/settings/web/general',
      content: 'General',
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/general\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/web/quality',
      content: 'Quality',
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/quality\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/web/player',
      content: 'Player',
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/player\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/online-media-sources',
      content: 'Online Media Sources',
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp:
        /^\/watch\/web\/index\.html#!\/settings\/online-media-sources\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/devices/all',
      content: 'Authorized Devices',
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/devices\/all\/?$/,
    },
  ];

  const filteredLinks = menuLinks;

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:hidden z-[1010]" ref={ref}>
      <Transition
        show={isOpen}
        as="div"
        className="absolute top-0 left-0 right-0 flex w-full max-h-[85dvh] transition ease-out duration-500 opacity-100 -translate-y-full data-[leave]:duration-500 data-[leave]:opacity-0 data-[leave]:translate-y-0 data-[closed]:opacity-0 data-[closed]:translate-y-0 flex-col border-t border-primary bg-primary bg-opacity-30 px-6 pt-6 font-semibold backdrop-blur"
      >
        {menuType === 'nav' ? (
          filteredLinks.map((link) => {
            const isActive = pathname.match(link.activeRegExp);
            return (
              <Link
                key={`mobile-menu-link-${link.href}`}
                href={link.href}
                className={`flex items-center space-x-2 px-4 py-2 last:mb-2 ${
                  isActive ? 'text-primary' : ''
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsOpen(false);
                  }
                }}
                onClick={() => setIsOpen(false)}
              >
                {cloneElement(isActive ? link.svgIconSelected : link.svgIcon, {
                  className: 'h-7 w-7',
                })}
                <span>{link.content}</span>
              </Link>
            );
          })
        ) : (
          <>
            {menuType === 'library' && (
              <LibraryMenu isOpen={isOpen} setIsOpen={setIsOpen} />
            )}
            {menuType === 'request' && (
              <RequestMenu isOpen={isOpen} onClick={setIsOpen} />
            )}
            {menuType === 'settings' && (
              <ul className="menu p-0 m-0 space-y-1">
                {settingsLinks.map((link, i) => {
                  const isActive = pathname.match(link.activeRegExp);
                  return (
                    <li key={i} className="">
                      <Link
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 ${isActive ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                        href={link.href}
                      >
                        {link.content}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <ul className="menu p-0 m-0 mt-2 mb-2">
              <li className="flex flex-row border-t border-zinc-300/40 pt-2 gap-1">
                <button
                  onClick={() => setMenuType('library')}
                  className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'library' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  Libraries
                </button>
                <button
                  onClick={() => setMenuType('request')}
                  className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'request' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  Request
                </button>
                {pathname.match(
                  /^\/watch\/web\/index\.html#?!?\/?(.*)?\/?/
                ) && (
                  <button
                    onClick={() => setMenuType('settings')}
                    className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'settings' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                  >
                    Settings
                  </button>
                )}
              </li>
            </ul>
          </>
        )}
      </Transition>
      <div className="padding-bottom-safe border-t border-primary bg-primary bg-opacity-30 backdrop-blur">
        <div className="flex h-full items-center justify-between px-6 py-2 text-primary-content backdrop-filter-none">
          <button
            className={`flex flex-col items-center space-y-1 ${
              isOpen &&
              (menuType === 'library' ||
                menuType === 'settings' ||
                menuType === 'request')
                ? 'text-primary'
                : ''
            }`}
            onClick={() => {
              if (
                menuType === 'library' ||
                menuType === 'settings' ||
                menuType === 'request' ||
                !isOpen
              ) {
                toggle();
              }
              if (
                !isOpen ||
                (menuType === 'nav' && !pathname.match(/^\/request\/?(.*)?\/?/))
              ) {
                setMenuType('library');
              }
              if (pathname.match(/^\/request\/?(.*)?\/?/)) {
                setMenuType('request');
              }
            }}
          >
            {isOpen &&
            (menuType === 'library' ||
              menuType === 'settings' ||
              menuType === 'request') ? (
              <Bars3BottomLeftIcon className="size-7" />
            ) : (
              <Bars3Icon className="size-7" />
            )}
          </button>
          {filteredLinks
            .slice(0, filteredLinks.length === 4 ? 4 : 3)
            .map((link) => {
              const isActive = pathname.match(link.activeRegExp) && !isOpen;
              return (
                <Link
                  key={`mobile-menu-link-${link.href}`}
                  href={link.href}
                  className={`flex flex-col items-center space-y-1 ${
                    isActive ? 'text-primary' : ''
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsOpen(false);
                    }
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  {cloneElement(
                    isActive ? link.svgIconSelected : link.svgIcon,
                    {
                      className: 'h-7 w-7',
                    }
                  )}
                </Link>
              );
            })}
          {filteredLinks.length > 3 && filteredLinks.length !== 4 && (
            <button
              className={`flex flex-col items-center space-y-1 ${
                isOpen && menuType === 'nav' ? 'text-primary' : ''
              }`}
              onClick={() => {
                if (menuType === 'nav' || !isOpen) {
                  toggle();
                }
                setMenuType('nav');
              }}
            >
              {isOpen && menuType === 'nav' ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <EllipsisHorizontalIcon className="h-6 w-6" />
              )}
            </button>
          )}
          <UserDropdown dropUp />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
