'use client';
import Accordion from '@app/components/Common/Accordion';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import LibraryMenu, { SingleItem } from '@app/components/Layout/LibraryMenu';
import UserDropdown from '@app/components/Layout/UserDropdown';
import VersionStatus from '@app/components/Layout/VersionStatus';
import useHash from '@app/hooks/useHash';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  CalendarDateRangeIcon,
  ChevronDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  HomeIcon,
  PaperAirplaneIcon,
  TvIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { SetStateAction } from 'react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

interface MenuLinksProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  regExp: RegExp;
}

const Sidebar = () => {
  const pathname = usePathname();
  const hash = useHash();
  const currentUrl = pathname + (hash || '');
  const { hasPermission } = useUser();
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const logoSrc = currentSettings.customLogo || '/logo_full.png';

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        id="sidebar"
        data-tutorial="sidebar-nav"
        className={`pointer-events-auto relative z-1006 flex-none max-sm:hidden lg:hidden print:hidden ${currentUrl.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && 'mx-2 my-3'}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="open sidebar"
          className="hover:text-primary! inline-flex h-10 min-h-10 shrink-0 cursor-pointer flex-wrap items-center justify-center gap-1 px-2 text-center"
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
        </button>
      </div>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-1006 lg:hidden"
      >
        <DialogBackdrop
          transition
          data-testid="sidebar-overlay"
          className="bg-base-300/30 fixed inset-0 z-1005 backdrop-blur-sm transition-opacity duration-300 ease-out data-closed:opacity-0"
        />
        <div className="fixed inset-0 z-1006 flex">
          <DialogPanel
            transition
            data-testid="mobile-drawer"
            className="menu bg-primary/30 border-primary min-h-full w-full max-w-64 overflow-y-auto border-r p-2 font-bold backdrop-blur-md transition duration-300 ease-out data-closed:-translate-x-full"
          >
            <div className="mb-2 flex flex-row place-content-between place-items-center">
              <Image
                src={logoSrc}
                alt="logo"
                width={176}
                height={52}
                unoptimized={true}
                className="mx-4 my-2 h-auto w-44"
              />
              <button
                onClick={() => setIsOpen(false)}
                aria-label="close sidebar"
                className="text-zinc-300 hover:cursor-pointer hover:text-white"
              >
                <XMarkIcon className="h-7 w-7" />
              </button>
            </div>
            <SidebarMenu isOpen={isOpen} onClick={() => setIsOpen(false)} />
            <div className="mt-auto w-full">
              <VersionStatus onClick={() => setIsOpen(false)} />
              {currentUrl.includes('/watch/web/index.html') && (
                <>
                  <div className="my-4 h-0.5 bg-zinc-300/40"></div>
                  <div className="flex flex-row place-content-end">
                    <DropDownMenu
                      dropUp
                      toolTip
                      ttplacement="top"
                      title={intl.formatMessage({
                        id: 'common.settings',
                        defaultMessage: 'Settings',
                      })}
                      tiptitle={intl.formatMessage({
                        id: 'common.settings',
                        defaultMessage: 'Settings',
                      })}
                      dropdownIcon={
                        <WrenchIcon className="h-6 w-6 scale-x-[-1]" />
                      }
                    >
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/web/general"
                      >
                        <FormattedMessage
                          id="common.general"
                          defaultMessage="General"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/web/quality"
                      >
                        <FormattedMessage
                          id="sidebar.quality"
                          defaultMessage="Quality"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/web/player"
                      >
                        <FormattedMessage
                          id="sidebar.player"
                          defaultMessage="Player"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/privacy"
                      >
                        <FormattedMessage
                          id="sidebar.privacy"
                          defaultMessage="Privacy"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/online-media-sources"
                        divide="before"
                      >
                        <FormattedMessage
                          id="sidebar.onlineMediaSources"
                          defaultMessage="Online Media Sources"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/devices/all"
                      >
                        <FormattedMessage
                          id="sidebar.authorizedDevices"
                          defaultMessage="Authorized Devices"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
                        href="/watch/web/index.html#!/settings/streaming-services"
                      >
                        <FormattedMessage
                          id="sidebar.streamingServices"
                          defaultMessage="Streaming Services"
                        />
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(false)}
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
          </DialogPanel>
        </div>
      </Dialog>
      {currentUrl.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && (
        <div className="pointer-events-none fixed top-0 right-0 z-1000 me-2 mt-2 flex-nowrap lg:flex lg:shrink-0">
          <div className="pointer-events-auto mt-1 mr-28 max-lg:hidden">
            <DropDownMenu
              title={intl.formatMessage({
                id: 'common.settings',
                defaultMessage: 'Settings',
              })}
              tiptitle={intl.formatMessage({
                id: 'common.settings',
                defaultMessage: 'Settings',
              })}
              toolTip
              ttplacement="bottom"
              dropdownIcon={<WrenchIcon className="h-6 w-6 scale-x-[-1]" />}
            >
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/general">
                <FormattedMessage
                  id="common.general"
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
        className={`menu border-neutral font-base fixed top-16 bottom-0 left-0 flex w-56 flex-1 flex-col flex-nowrap overflow-auto border-r p-2 max-lg:hidden`}
      >
        <SidebarMenu />
        {hasPermission([Permission.ADMIN]) && (
          <div className="mt-auto w-full">
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
  const { hasPermission, user } = useUser();
  const pathname = usePathname();
  const hash = useHash();
  const url = pathname + (hash || '');
  const intl = useIntl();
  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  return (
    <div className="mb-1 w-full space-y-1">
      <Accordion
        single
        atLeastOne
        initialOpenIndexes={url.match(/^\/request\/?(.*)?\/?/) ? [1] : [0]}
      >
        {({ openIndexes, handleClick, AccordionContent }) => (
          <span className="pointer-events-auto">
            <div className="mb-1 flex">
              <SingleItem
                className="flex-1"
                linkclasses={`${!openIndexes.includes(0) ? 'rounded-r-none' : ''}`}
                liKey={'home'}
                data-tutorial="nav-home"
                data-testid="nav-home"
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
                  className={`focus:bg-primary/70! active:bg-primary/20! flex flex-1 items-center gap-0 rounded-l-none ${url.match(/^\/watch\/web\/index\.html#?!?\/?/) && 'bg-primary/70 hover:bg-primary/30'}`}
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
              userSettings?.requestUrl && (
                <>
                  <div className="mb-1 flex">
                    <SingleItem
                      className="flex-1"
                      linkclasses={`${!openIndexes.includes(1) ? 'rounded-r-none' : ''}`}
                      liKey={'request'}
                      data-tutorial="nav-request"
                      data-testid="nav-request"
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
                          alt="Seerr"
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
                        className={`focus:bg-primary/70! active:bg-primary/20! flex flex-1 items-center rounded-l-none ${url.match(/^\/request\/?(.*)?\/?/) && 'bg-primary/70 hover:bg-primary/30 hover:text-zinc-200'}`}
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
          data-tutorial="nav-invites"
          data-testid="nav-invites"
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
      {userSettings?.releaseSched &&
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
            data-tutorial="nav-schedule"
            data-testid="nav-schedule"
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
      icon: <FilmIcon className="h-7 w-7" />,
      regExp: /\/request\/discover\/movies/,
    },
    {
      href: '/request/discover/tv',
      title: intl.formatMessage({
        id: 'common.shows',
        defaultMessage: 'Shows',
      }),
      icon: <TvIcon className="h-7 w-7" />,
      regExp: /\/request\/discover\/tv/,
    },
    {
      href: '/request/requests',
      title: intl.formatMessage({
        id: 'common.requests',
        defaultMessage: 'Requests',
      }),
      icon: <ClockIcon className="h-7 w-7" />,
      regExp: /\/request\/requests/,
    },
    {
      href: '/request/issues',
      title: intl.formatMessage({
        id: 'common.issues',
        defaultMessage: 'Issues',
      }),
      icon: <ExclamationTriangleIcon className="h-7 w-7" />,
      regExp: /\/request\/issues/,
    },
  ];
  return (
    <ul className="menu m-0 my-1 w-full space-y-1 p-0">
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
