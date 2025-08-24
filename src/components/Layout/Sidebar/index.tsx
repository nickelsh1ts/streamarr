'use client';
import LibraryMenu, { SingleItem } from '@app/components/Layout/LibraryMenu';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import {
  HomeIcon,
  CalendarDateRangeIcon,
  PaperAirplaneIcon,
  WrenchIcon,
  XMarkIcon,
  FilmIcon,
  TvIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import type { SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import Accordion from '@app/components/Common/Accordion';
import Image from 'next/image';
import VersionStatus from '@app/components/Layout/VersionStatus';
import UserDropdown from '@app/components/Layout/UserDropdown';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { usePathname } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

interface MenuLinksProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  regExp: RegExp;
}

const Sidebar = () => {
  const [currentUrl, setCurrentUrl] = useState('');
  const { hasPermission } = useUser();
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const logoSrc = currentSettings.customLogo || '/logo_full.png';

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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header
        id="sidebar"
        className="w-fit transition duration-500 drawer font-bold z-[1006] max-sm:hidden lg:hidden"
      >
        <input
          id="my-drawer-3"
          type="checkbox"
          className="drawer-toggle pointer-events-auto"
          checked={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          onChange={() => setIsOpen(!isOpen)}
        />
        <div
          className={`flex-none print:hidden lg:hidden pointer-events-auto ${currentUrl.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && 'my-3 mx-2'}`}
        >
          <label
            htmlFor="my-drawer-3"
            aria-label="open sidebar"
            className="inline-flex h-10 min-h-10 flex-shrink-0 flex-wrap items-center justify-center px-2 gap-1 text-center hover:!text-primary cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-7 w-7 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </label>
        </div>
        <div className="drawer-side lg:hidden">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className={`drawer-overlay mb-0 ${isOpen && 'backdrop-blur-sm'}`}
          />
          <ul className="menu bg-primary backdrop-blur-md bg-opacity-30 min-h-full w-full max-w-64 p-2 border-r border-primary">
            <div className="flex flex-row place-items-center place-content-between mb-2">
              <Image
                src={logoSrc}
                alt="logo"
                width={176}
                height={52}
                unoptimized={true}
                className="my-2 mx-4 h-auto w-44"
              />
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="close sidebar"
                className="text-zinc-300 hover:text-white hover:cursor-pointer"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>
            </div>
            <SidebarMenu isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            <div className="mt-auto">
              <VersionStatus onClick={() => setIsOpen(!isOpen)} />
              {currentUrl.includes('/watch/web/index.html') && (
                <>
                  <div className="bg-zinc-300/40 h-0.5 my-4"></div>
                  <div className="flex flex-row place-content-end">
                    <DropDownMenu
                      dropUp
                      toolTip
                      ttplacement="top"
                      title={intl.formatMessage({
                        id: 'sidebar.settings',
                        defaultMessage: 'Settings',
                      })}
                      tiptitle={intl.formatMessage({
                        id: 'sidebar.settings',
                        defaultMessage: 'Settings',
                      })}
                      dropdownIcon={
                        <WrenchIcon className="w-6 h-6 scale-x-[-1]" />
                      }
                    >
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/general"
                      >
                        <FormattedMessage
                          id="sidebar.general"
                          defaultMessage="General"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/quality"
                      >
                        <FormattedMessage
                          id="sidebar.quality"
                          defaultMessage="Quality"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/player"
                      >
                        <FormattedMessage
                          id="sidebar.player"
                          defaultMessage="Player"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/privacy"
                      >
                        <FormattedMessage
                          id="sidebar.privacy"
                          defaultMessage="Privacy"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/online-media-sources"
                        divide="before"
                      >
                        <FormattedMessage
                          id="sidebar.onlineMediaSources"
                          defaultMessage="Online Media Sources"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/devices/all"
                      >
                        <FormattedMessage
                          id="sidebar.authorizedDevices"
                          defaultMessage="Authorized Devices"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/streaming-services"
                      >
                        <FormattedMessage
                          id="sidebar.streamingServices"
                          defaultMessage="Streaming Services"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/manage-library-access"
                      >
                        <FormattedMessage
                          id="sidebar.manageLibraryAccess"
                          defaultMessage="Manage Library Access"
                        />
                      </DropDownMenu.Item>
                    </DropDownMenu>
                  </div>
                </>
              )}
            </div>
          </ul>
        </div>
      </header>
      {currentUrl.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && (
        <div className="fixed top-0 right-0 mt-2 me-2 z-[1000] lg:flex lg:flex-shrink-0 flex-nowrap pointer-events-none">
          <div className="mt-1 mr-28 pointer-events-auto max-lg:hidden">
            <DropDownMenu
              title={intl.formatMessage({
                id: 'sidebar.settings',
                defaultMessage: 'Settings',
              })}
              tiptitle={intl.formatMessage({
                id: 'sidebar.settings',
                defaultMessage: 'Settings',
              })}
              toolTip
              ttplacement="bottom"
              dropdownIcon={<WrenchIcon className="w-6 h-6 scale-x-[-1]" />}
            >
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/general">
                <FormattedMessage
                  id="sidebar.general"
                  defaultMessage="General"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/quality">
                <FormattedMessage
                  id="sidebar.quality"
                  defaultMessage="Quality"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/player">
                <FormattedMessage id="sidebar.player" defaultMessage="Player" />
              </DropDownMenu.Item>
              <DropDownMenu.Item
                onClick={() => setIsOpen(!isOpen)}
                href="/watch/web/index.html#!/settings/privacy"
              >
                <FormattedMessage
                  id="sidebar.privacy"
                  defaultMessage="Privacy"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item
                href="/watch/web/index.html#!/settings/online-media-sources"
                divide="before"
              >
                <FormattedMessage
                  id="sidebar.onlineMediaSources"
                  defaultMessage="Online Media Sources"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/devices/all">
                <FormattedMessage
                  id="sidebar.authorizedDevices"
                  defaultMessage="Authorized Devices"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item
                onClick={() => setIsOpen(!isOpen)}
                href="/watch/web/index.html#!/settings/streaming-services"
              >
                <FormattedMessage
                  id="sidebar.streamingServices"
                  defaultMessage="Streaming Services"
                />
              </DropDownMenu.Item>
              <DropDownMenu.Item
                onClick={() => setIsOpen(!isOpen)}
                href="/watch/web/index.html#!/settings/manage-library-access"
              >
                <FormattedMessage
                  id="sidebar.manageLibraryAccess"
                  defaultMessage="Manage Library Access"
                />
              </DropDownMenu.Item>
            </DropDownMenu>
          </div>
          <div className="pointer-events-auto max-sm:hidden">
            <UserDropdown tooltip />
          </div>
        </div>
      )}
      <ul
        id="sidebarMenu"
        className={`menu w-56 p-2 max-lg:hidden fixed top-[4rem] bottom-0 left-0 flex flex-col flex-1 flex-nowrap overflow-auto border-r border-neutral-700 font-base`}
      >
        <SidebarMenu />
        {hasPermission([Permission.ADMIN]) && (
          <div className="mt-auto">
            <VersionStatus />
          </div>
        )}
      </ul>
    </>
  );
};

interface SidebarProps {
  onClick?: (value: SetStateAction<boolean>) => void;
  isOpen?: boolean;
}

export const SidebarMenu = ({ onClick, isOpen }: SidebarProps) => {
  const { currentSettings } = useSettings();
  const { hasPermission } = useUser();
  const pathname = usePathname();
  const [url, setCurrentUrl] = useState(pathname);
  const intl = useIntl();
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

  return (
    <div className="space-y-1 mb-1 w-full">
      <Accordion
        single
        atLeastOne
        initialOpenIndexes={url.match(/^\/request\/?(.*)?\/?/) ? [1] : [0]}
      >
        {({ openIndexes, handleClick, AccordionContent }) => (
          <span className="pointer-events-auto">
            <div className="flex mb-1">
              <SingleItem
                className="flex-1"
                linkclasses={`${!openIndexes.includes(0) ? 'rounded-r-none' : ''}`}
                liKey={'home'}
                onClick={() => {
                  onClick && onClick(!isOpen);
                  handleClick(0);
                }}
                href={'/watch/web/index.html#!'}
                title={intl.formatMessage({
                  id: 'common.home',
                  defaultMessage: 'Home',
                })}
                icon={<HomeIcon className="size-7" />}
                url={url}
                regExp={/\/watch\/web\/index\.html(#!)?\/?$/}
              />
              <li className={`${openIndexes.includes(0) ? 'hidden' : ''}`}>
                <button
                  onClick={() => handleClick(0)}
                  className={`items-center flex-1 flex focus:!bg-primary/70 active:!bg-primary/20 gap-0 text-zinc-300 hover:text-white rounded-l-none ${url.match(/^\/watch\/web\/index\.html#?!?\/?/) && 'bg-primary/70 hover:bg-primary/30 hover:text-zinc-200'}`}
                >
                  <ChevronDownIcon className="size-5" />
                </button>
              </li>
            </div>
            <AccordionContent isOpen={openIndexes.includes(0)}>
              <LibraryMenu isOpen={isOpen} setIsOpen={onClick} />
            </AccordionContent>
            {hasPermission([Permission.REQUEST, Permission.STREAMARR], {
              type: 'or',
            }) &&
              currentSettings?.enableRequest && (
                <>
                  <div className="flex">
                    <SingleItem
                      className="flex-1"
                      linkclasses={`${!openIndexes.includes(1) ? 'rounded-r-none' : ''}`}
                      liKey={'request'}
                      onClick={() => {
                        onClick && onClick(!isOpen);
                        handleClick(1);
                      }}
                      href={'/request'}
                      title={intl.formatMessage({
                        id: 'common.request',
                        defaultMessage: 'Request',
                      })}
                      icon={
                        <Image
                          alt="Overseerr"
                          width={28}
                          height={28}
                          src={'/external/os-icon.svg'}
                        />
                      }
                      url={url}
                      regExp={/\/request\/?$/}
                    />
                    <li
                      className={`${openIndexes.includes(1) ? 'hidden' : ''}`}
                    >
                      <button
                        onClick={() => handleClick(1)}
                        className={`items-center flex-1 flex focus:!bg-primary/70 active:!bg-primary/20 text-zinc-300 hover:text-white rounded-l-none ${url.match(/^\/request\/?(.*)?\/?/) && 'bg-primary/70 hover:bg-primary/30 hover:text-zinc-200'}`}
                      >
                        <ChevronDownIcon className="size-5" />
                      </button>
                    </li>
                  </div>
                  <AccordionContent isOpen={openIndexes.includes(1)}>
                    <RequestMenu onClick={onClick} url={url} />
                  </AccordionContent>
                </>
              )}
          </span>
        )}
      </Accordion>
      {hasPermission(
        [
          Permission.CREATE_INVITES,
          Permission.MANAGE_INVITES,
          Permission.VIEW_INVITES,
          Permission.STREAMARR,
        ],
        { type: 'or' }
      ) && (
        <SingleItem
          liKey={'invites'}
          onClick={() => onClick && onClick(!isOpen)}
          href={'/invites'}
          title={intl.formatMessage({
            id: 'common.invites',
            defaultMessage: 'Invites',
          })}
          icon={<PaperAirplaneIcon className="size-7" />}
          url={url}
          regExp={/\/invites/}
        />
      )}
      {currentSettings.releaseSched &&
        hasPermission(
          [
            Permission.VIEW_SCHEDULE,
            Permission.CREATE_EVENTS,
            Permission.STREAMARR,
          ],
          { type: 'or' }
        ) && (
          <SingleItem
            liKey={'schedule'}
            onClick={() => onClick && onClick(!isOpen)}
            href={'/schedule'}
            title={intl.formatMessage({
              id: 'common.releaseSchedule',
              defaultMessage: 'Release Schedule',
            })}
            icon={<CalendarDateRangeIcon className="size-7" />}
            url={url}
            regExp={/\/schedule/}
          />
        )}
    </div>
  );
};

interface RequestMenuProps {
  onClick: (value: SetStateAction<boolean>) => void;
}

export const RequestMenu = ({
  onClick,
  url,
}: RequestMenuProps & { url: string }) => {
  const intl = useIntl();
  const RequestLinks: MenuLinksProps[] = [
    {
      href: '/request/discover/movies',
      title: intl.formatMessage({
        id: 'common.movies',
        defaultMessage: 'Movies',
      }),
      icon: <FilmIcon className="w-7 h-7" />,
      regExp: /\/request\/discover\/movies/,
    },
    {
      href: '/request/discover/tv',
      title: intl.formatMessage({
        id: 'common.shows',
        defaultMessage: 'Shows',
      }),
      icon: <TvIcon className="w-7 h-7" />,
      regExp: /\/request\/discover\/tv/,
    },
    {
      href: '/request/requests',
      title: intl.formatMessage({
        id: 'common.requests',
        defaultMessage: 'Requests',
      }),
      icon: <ClockIcon className="w-7 h-7" />,
      regExp: /\/request\/requests/,
    },
    {
      href: '/request/issues',
      title: intl.formatMessage({
        id: 'common.issues',
        defaultMessage: 'Issues',
      }),
      icon: <ExclamationTriangleIcon className="w-7 h-7" />,
      regExp: /\/request\/issues/,
    },
  ];
  return (
    <ul className="menu m-0 p-0 space-y-1 mt-1">
      {RequestLinks.map((link) => {
        return (
          <SingleItem
            key={link.title}
            liKey={link.title}
            onClick={() => onClick && onClick(false)}
            href={link.href}
            title={link.title}
            icon={link.icon}
            url={url}
            regExp={link.regExp}
          />
        );
      })}
    </ul>
  );
};

export default Sidebar;
