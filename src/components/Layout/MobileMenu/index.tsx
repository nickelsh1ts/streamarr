'use client';
import LibraryMenu from '@app/components/Layout/LibraryMenu';
import { RequestMenu } from '@app/components/Layout/Sidebar';
import UserDropdown from '@app/components/Layout/UserDropdown';
import useClickOutside from '@app/hooks/useClickOutside';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { Transition } from '@headlessui/react';
import {
  Bars3BottomLeftIcon,
  CalendarDateRangeIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  PaperAirplaneIcon,
  NewspaperIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  PaperAirplaneIcon as FilledPaperAirplaneIcon,
  CalendarDateRangeIcon as FilledCalendarDateRangeIcon,
  HomeIcon as FilledHomeIcon,
  XMarkIcon,
  Bars3Icon,
  NewspaperIcon as FilledNewspaperIcon,
  BookmarkIcon as FilledBookmarkIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import type { JSX } from 'react';
import { cloneElement, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface MenuLink {
  href: string;
  svgIcon: JSX.Element;
  svgIconSelected: JSX.Element;
  content: React.ReactNode;
  activeRegExp: RegExp;
  as?: string;
  dataTestId?: string;
  hidden?: boolean;
}

const MobileMenu = () => {
  const intl = useIntl();
  const { currentSettings } = useSettings();
  const { hasPermission } = useUser();
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuType, setMenuType] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  useEffect(() => {
    let lastUrl = window.location.pathname + window.location.hash;
    setCurrentUrl(lastUrl);
    const interval = setInterval(() => {
      const newUrl = window.location.pathname + window.location.hash;
      if (newUrl !== lastUrl) {
        lastUrl = newUrl;
        setCurrentUrl(newUrl);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  const url = currentUrl;
  useClickOutside(ref, () => {
    setTimeout(() => {
      if (isOpen) {
        setIsOpen(false);
      }
    }, 150);
  });

  const toggle = () => setIsOpen(!isOpen);

  const invitesDisabled = !hasPermission(
    [
      Permission.CREATE_INVITES,
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.STREAMARR,
    ],
    { type: 'or' }
  );

  const scheduleDisabled =
    !currentSettings?.releaseSched ||
    !hasPermission(
      [
        Permission.VIEW_SCHEDULE,
        Permission.CREATE_EVENTS,
        Permission.STREAMARR,
      ],
      { type: 'or' }
    );

  const requestDisabled =
    !hasPermission([Permission.REQUEST, Permission.STREAMARR], {
      type: 'or',
    }) || !currentSettings?.enableRequest;

  const isWatchRoute = url.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?\/?/);

  const menuLinks: MenuLink[] = [
    {
      href: '/watch/web/index.html#!',
      content: intl.formatMessage({
        id: 'common.home',
        defaultMessage: 'Home',
      }),
      svgIcon: <HomeIcon className="size-7" />,
      svgIconSelected: <FilledHomeIcon className="size-7" />,
      activeRegExp: /^\/watch\/web\/index\.html#!\/?$/,
    },
    {
      href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=home&pivot=discover.recommended',
      content: intl.formatMessage({
        id: 'library.discover',
        defaultMessage: 'Discover',
      }),
      svgIcon: <NewspaperIcon className="w-7 h-7" />,
      svgIconSelected: <FilledNewspaperIcon className="h-6 w-6" />,
      activeRegExp: /(?=(\/(.*)=home&pivot=discover))/,
      hidden: !invitesDisabled, // Show when invites is disabled
    },
    {
      href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=watchlist&pivot=discover.watchlist',
      content: intl.formatMessage({
        id: 'library.watchlist',
        defaultMessage: 'Watch List',
      }),
      svgIcon: <BookmarkIcon className="h-6 w-6" />,
      svgIconSelected: <FilledBookmarkIcon className="h-6 w-6" />,
      activeRegExp: /(?=(\/(.*)=watchlist&pivot=discover))/,
      hidden: !scheduleDisabled, // Show when schedule is disabled
    },
    {
      href: '/request',
      content: intl.formatMessage({
        id: 'common.request',
        defaultMessage: 'Request',
      }),
      svgIcon: (
        <Image
          alt="Overseerr"
          src={'/external/os-icon.svg'}
          width={24}
          height={24}
        />
      ),
      svgIconSelected: (
        <Image
          alt="Overseerr"
          src={'/external/os-icon.svg'}
          width={24}
          height={24}
        />
      ),
      activeRegExp: /^\/request\/?$/,
      hidden: requestDisabled,
    },
    {
      href: '/invites',
      content: intl.formatMessage({
        id: 'common.invite',
        defaultMessage: 'Invite',
      }),
      svgIcon: <PaperAirplaneIcon className="h-6 w-6" />,
      svgIconSelected: <FilledPaperAirplaneIcon className="h-6 w-6" />,
      activeRegExp: /^\/invites\/?/,
      hidden: invitesDisabled,
    },
    {
      href: '/schedule',
      content: intl.formatMessage({
        id: 'common.schedule',
        defaultMessage: 'Schedule',
      }),
      svgIcon: <CalendarDateRangeIcon className="h-6 w-6" />,
      svgIconSelected: <FilledCalendarDateRangeIcon className="h-6 w-6" />,
      activeRegExp: /^\/schedule\/?/,
      hidden: scheduleDisabled,
    },
  ];

  const settingsLinks: MenuLink[] = [
    {
      href: '/watch/web/index.html#!/settings/web/general',
      content: intl.formatMessage({
        id: 'sidebar.general',
        defaultMessage: 'General',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/general\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/web/quality',
      content: intl.formatMessage({
        id: 'sidebar.quality',
        defaultMessage: 'Quality',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/quality\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/web/player',
      content: intl.formatMessage({
        id: 'sidebar.player',
        defaultMessage: 'Player',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/web\/player\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/privacy',
      content: intl.formatMessage({
        id: 'sidebar.privacy',
        defaultMessage: 'Privacy',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/privacy\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/online-media-sources',
      content: intl.formatMessage({
        id: 'sidebar.onlineMediaSources',
        defaultMessage: 'Online Media Sources',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp:
        /^\/watch\/web\/index\.html#!\/settings\/online-media-sources\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/devices/all',
      content: intl.formatMessage({
        id: 'sidebar.authorizedDevices',
        defaultMessage: 'Authorized Devices',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp: /^\/watch\/web\/index\.html#!\/settings\/devices\/all\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/streaming-services',
      content: intl.formatMessage({
        id: 'sidebar.streamingServices',
        defaultMessage: 'Streaming Services',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp:
        /^\/watch\/web\/index\.html#!\/settings\/streaming-services\/?$/,
    },
    {
      href: '/watch/web/index.html#!/settings/manage-library-access',
      content: intl.formatMessage({
        id: 'sidebar.manageLibraryAccess',
        defaultMessage: 'Manage Library Access',
      }),
      svgIcon: null,
      svgIconSelected: null,
      activeRegExp:
        /^\/watch\/web\/index\.html#!\/settings\/manage-library-access\/?$/,
    },
  ];

  const filteredLinks = menuLinks.filter((link) => !link.hidden);

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:hidden z-[1010]" ref={ref}>
      <Transition
        show={isOpen}
        as="div"
        className="absolute top-0 left-0 right-0 flex w-full max-h-[85dvh] transition ease-out duration-500 opacity-100 -translate-y-full data-[leave]:duration-500 data-[leave]:opacity-0 data-[leave]:translate-y-0 data-[closed]:opacity-0 data-[closed]:translate-y-0 flex-col border-t border-primary bg-primary bg-opacity-30 px-6 pt-6 font-semibold backdrop-blur"
      >
        {menuType === 'nav' ? (
          filteredLinks.map((link) => {
            const isActive = url.match(link.activeRegExp);
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
              <LibraryMenu isMobile isOpen={isOpen} setIsOpen={setIsOpen} />
            )}
            {menuType === 'request' && (
              <RequestMenu onClick={setIsOpen} url={url} />
            )}
            {menuType === 'settings' && (
              <ul className="menu p-0 m-0 space-y-1">
                {settingsLinks.map((link, i) => {
                  const isActive = url.match(link.activeRegExp);
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
              {(isWatchRoute || !requestDisabled) && (
                <li className="flex flex-row border-t border-zinc-300/40 pt-2 gap-1">
                  <button
                    onClick={() => setMenuType('library')}
                    className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'library' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                  >
                    <FormattedMessage
                      id="mobileMenu.libraries"
                      defaultMessage="Libraries"
                    />
                  </button>
                  {!requestDisabled && (
                    <button
                      onClick={() => setMenuType('request')}
                      className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'request' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <FormattedMessage
                        id="common.request"
                        defaultMessage="Request"
                      />
                    </button>
                  )}
                  {isWatchRoute && (
                    <button
                      onClick={() => setMenuType('settings')}
                      className={`flex items-center focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 flex-1 place-content-center ${menuType === 'settings' ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <FormattedMessage
                        id="sidebar.settings"
                        defaultMessage="Settings"
                      />
                    </button>
                  )}
                </li>
              )}
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
                (menuType === 'nav' && !url.match(/^\/request\/?(.*)?\/?/))
              ) {
                setMenuType('library');
              }
              if (url.match(/^\/request\/?(.*)?\/?/) && !requestDisabled) {
                setMenuType('request');
              }
              if (
                url.match(/^\/watch\/web\/index\.html#!\/settings\/?(.*)?\/?/)
              ) {
                setMenuType('settings');
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
              const isActive = url.match(link.activeRegExp) && !isOpen;
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
                    { className: 'h-7 w-7' }
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
