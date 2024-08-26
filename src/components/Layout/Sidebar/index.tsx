import LibraryMenu from '@app/components/Layout/Sidebar/LibraryMenu';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import {
  CalendarDaysIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import {
  Cog6ToothIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

const OptionsLinks = [
  {
    href: '/schedule',
    messagesKey: 'Release Shedule',
    icon: <CalendarDaysIcon className="w-6 h-6" />,
  },
  {
    href: '/invite',
    messagesKey: 'Invite a Friend',
    icon: <PaperAirplaneIcon className="w-6 h-6" />,
  },
  {
    href: '/stats',
    messagesKey: 'Statistics',
    icon: <PresentationChartLineIcon className="w-6 h-6" />,
  },
  {
    href: '/admin',
    messagesKey: 'Admin Centre',
    icon: <LockClosedIcon className="w-6 h-6" />,
  },
  {
    href: '/#faqs',
    messagesKey: 'FAQs',
    divide: 'before',
  },
  {
    href: '/help',
    messagesKey: 'Help Centre',
  },
  {
    href: 'https://discord.gg/ZSTrRJMcDS',
    messagesKey: 'Get Support',
    target: '_blank',
  },
];

const SettingsLinks = [
  {
    href: '/watch/web/index.html#!/settings/web/general',
    messagesKey: 'General',
  },
  {
    href: '/watch/web/index.html#!/settings/web/quality',
    messagesKey: 'Quality',
  },
  {
    href: '/watch/web/index.html#!/settings/web/player',
    messagesKey: 'Player',
  },
  {
    href: '/watch/web/index.html#!/settings/online-media-sources',
    messagesKey: 'Online Media Sources',
    divide: 'before',
  },
  {
    href: '/watch/web/index.html#!/settings/devices/all',
    messagesKey: 'Authorized Devices',
  },
  {
    href: '/',
    messagesKey: 'Log out of Streamarr',
    divide: 'before',
  },
];

const Sidebar = () => {
  return (
    <>
      <header
        id=""
        className="navbar w-fit transition duration-500 drawer font-bold z-[1006] lg:hidden"
      >
        <input
          id="my-drawer-3"
          type="checkbox"
          className="drawer-toggle pointer-events-auto"
        />
        <div className="drawer-content gap-2 min-h-10"></div>
        <div className="flex-none print:hidden max-sm:hidden lg:hidden pointer-events-auto">
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
        <div className="drawer-side max-sm:hidden lg:hidden">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <ul className="menu bg-primary backdrop-blur-md bg-opacity-30 min-h-full w-72 p-4 gap-1 border-r border-primary">
            <div className="inline-flex place-items-center place-content-between">
              <img
                src="/logo_full.png"
                alt="logo"
                className="w-40 md:w-48 h-auto mb-2 mt-2"
              />
              <label
                htmlFor="my-drawer-3"
                aria-label="close sidebar"
                className="text-zinc-300 hover:text-white hover:cursor-pointer"
              >
                <XMarkIcon className="w-7 h-7" />
              </label>
            </div>
            <LibraryMenu />
            <div className="mt-auto">
              <div className="bg-zinc-300/40 h-0.5 my-4"></div>
              <div className="flex flex-row place-content-end">
                <DropDownMenu
                  dropUp
                  title="Options"
                  menuLinks={OptionsLinks}
                  icon={<Cog6ToothIcon className="w-6 h-6" />}
                />
                <DropDownMenu
                  dropUp
                  title="Settings"
                  menuLinks={SettingsLinks}
                  icon={<WrenchIcon className="w-6 h-6 scale-x-[-1]" />}
                />
              </div>
            </div>
          </ul>
        </div>
      </header>
      <div className="fixed top-0 right-0 me-[7.5rem] mt-4 z-[1006] max-lg:hidden lg:flex lg:flex-shrink-0 flex-nowrap ">
        <div className="flex flex-row place-content-end">
          <DropDownMenu
            title={'Options'}
            menuLinks={OptionsLinks}
            icon={<Cog6ToothIcon className="w-6 h-6" />}
          />
          <DropDownMenu
            title="Settings"
            menuLinks={SettingsLinks}
            icon={<WrenchIcon className="w-6 h-6 scale-x-[-1]" />}
          />
        </div>
      </div>
      <ul className="menu w-56 p-2 gap-2 max-lg:hidden fixed top-0 bottom-0 left-0 z-[1006] lg:flex lg:flex-shrink-0 flex-nowrap overflow-auto mt-[3.75rem]">
        <LibraryMenu />
      </ul>
    </>
  );
};

export default Sidebar;
