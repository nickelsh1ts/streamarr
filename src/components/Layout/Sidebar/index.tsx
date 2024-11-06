'use client';
import LibraryMenu, { SingleItem } from '@app/components/Layout/LibraryMenu';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import {
  HomeIcon,
  CalendarDateRangeIcon,
  PaperAirplaneIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import useHash from '@app/hooks/useHash';
import Image from 'next/image';
import UserDropdown from '@app/components/Layout/UserDropdown';
import { useState } from 'react';

const Sidebar = () => {
  const path = usePathname() + useHash();
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
        />
        <div
          className={`flex-none print:hidden lg:hidden pointer-events-auto ${path.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && 'my-3 mx-2'}`}
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
          <ul className="menu bg-primary backdrop-blur-md bg-opacity-30 min-h-full w-full max-w-64 p-2 gap-1 border-r border-primary">
            <div className="flex flex-row place-items-center place-content-between mb-2">
              <img
                src="/logo_full.png"
                alt="logo"
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
              {path.includes('/watch/web/index.html') && (
                <>
                  <div className="bg-zinc-300/40 h-0.5 my-4"></div>
                  <div className="flex flex-row place-content-end">
                    <DropDownMenu
                      dropUp
                      toolTip
                      ttplacement="top"
                      title="settings"
                      tiptitle="settings"
                      dropdownIcon={
                        <WrenchIcon className="w-6 h-6 scale-x-[-1]" />
                      }
                    >
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/general"
                      >
                        General
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/quality"
                      >
                        Quality
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/web/player"
                      >
                        Player
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/online-media-sources"
                        divide="before"
                      >
                        Online Media Sources
                      </DropDownMenu.Item>
                      <DropDownMenu.Item
                        onClick={() => setIsOpen(!isOpen)}
                        href="/watch/web/index.html#!/settings/devices/all"
                      >
                        Authorized Devices
                      </DropDownMenu.Item>
                    </DropDownMenu>
                  </div>
                </>
              )}
            </div>
          </ul>
        </div>
      </header>
      {path.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && (
        <div className="fixed top-0 right-0 mt-2 me-2 z-[1000] lg:flex lg:flex-shrink-0 flex-nowrap pointer-events-none">
          <div className="mt-1 mr-28 pointer-events-auto max-lg:hidden">
            <DropDownMenu
              title="settings"
              tiptitle="settings"
              toolTip
              ttplacement="bottom"
              dropdownIcon={<WrenchIcon className="w-6 h-6 scale-x-[-1]" />}
            >
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/general">
                General
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/quality">
                Quality
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/web/player">
                Player
              </DropDownMenu.Item>
              <DropDownMenu.Item
                href="/watch/web/index.html#!/settings/online-media-sources"
                divide="before"
              >
                Online Media Sources
              </DropDownMenu.Item>
              <DropDownMenu.Item href="/watch/web/index.html#!/settings/devices/all">
                Authorized Devices
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
        className={`menu w-56 p-2 gap-1 max-lg:hidden fixed top-0 bottom-0 left-0 lg:flex lg:flex-shrink-0 flex-nowrap overflow-auto mt-[3.75rem] pointer-events-none ${!path.match(/^\/watch\/web\/index\.html#?!?\/?(.*)?/) && 'backdrop-blur-md'}`}
      >
        <SidebarMenu />
      </ul>
    </>
  );
};

interface SidebarProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export const SidebarMenu = ({ onClick, isOpen }: SidebarProps) => {
  const path = usePathname() + useHash();
  return (
    <>
      <SingleItem
        key={'home'}
        onClick={onClick}
        href={'/watch/web/index.html#!'}
        title={'Home'}
        icon={<HomeIcon className="size-7" />}
        active={path.match(/\/watch\/web\/index\.html#?!?\/?$/)}
      />
      <LibraryMenu isOpen={isOpen} setIsOpen={onClick} />
      <SingleItem
        key={'request'}
        onClick={onClick}
        href={'/request'}
        title={'Request'}
        icon={
          <Image
            alt="Overseerr"
            width={28}
            height={28}
            src={'/external/os-icon.svg'}
          />
        }
        active={path.match(/\/request\/?/)}
      />
      <SingleItem
        key={'invite'}
        onClick={onClick}
        href={'/invite'}
        title={'Invite'}
        icon={<PaperAirplaneIcon className="size-7" />}
        active={path.match(/\/invite\/?/)}
      />
      <SingleItem
        key={'schedule'}
        onClick={onClick}
        href={'/schedule'}
        title={'Release Schedule'}
        icon={<CalendarDateRangeIcon className="size-7" />}
        active={path.match(/\/schedule\/?/)}
      />
    </>
  );
};

export default Sidebar;
