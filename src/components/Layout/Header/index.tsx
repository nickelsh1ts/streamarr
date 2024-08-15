'use client';
import {
  FilmIcon,
  ArrowRightEndOnRectangleIcon,
  BookmarkIcon,
  NewspaperIcon,
  TvIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarDaysIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  HomeIcon,
  LifebuoyIcon,
  LockClosedIcon,
  MusicalNoteIcon,
  PaperAirplaneIcon,
  VideoCameraIcon,
  WrenchIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuLinksProps {
  href: string;
  messagesKey: string;
  icon: React.ReactNode;
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/watch/web/index.html#!/',
    messagesKey: 'Home',
    icon: <HomeIcon className="w-7 h-7 inline-flex" />,
  },
  {
    href: '/watch/web/index.html',
    messagesKey: 'Discover',
    icon: <NewspaperIcon className="w-7 h-7 inline-flex" />,
  },
  {
    href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=watchlist',
    messagesKey: 'Watch List',
    icon: <BookmarkIcon className="w-7 h-7 inline-flex" />,
  },
  {
    href: '/help',
    messagesKey: 'Help Centre',
    icon: <LifebuoyIcon className="w-7 h-7 inline-flex" />,
  },
];

const Header = ({ isInView = true }) => {
  const path = usePathname();

  return (
    <header
      id="top"
      className={`navbar ${path === '/' && 'sticky top-0'} transition duration-500 drawer ${isInView && 'bg-brand-dark'} font-bold z-10`}
    >
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content md:px-10 flex-1 max-sm:flex-wrap max-sm:place gap-2 min-h-10">
        {path != '/' && (
          <div className="flex-none max-md:hidden lg:hidden print:hidden">
            <label
              htmlFor="my-drawer-3"
              aria-label="open sidebar"
              className="btn btn-circle btn-ghost"
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
        )}
        <Link
          href="/"
          className={`hover:brightness-75 transition-opacity duration-500 ${!isInView && 'opacity-0 pointer-events-none'}`}
        >
          <img
            src="/logo_full.png"
            alt="logo"
            className="w-40 md:w-52 h-auto"
          />
        </Link>
        {path != '/watch' && path != '/' && (
          <div className="divider divider-horizontal divider-neutral mx-0 max-lg:hidden"></div>
        )}
        {path != '/watch' &&
          path != '/' &&
          MenuLinks.map((menuLink) => {
            const isActive = path.includes(menuLink.href);
            return (
              <Link
                key={menuLink.href}
                href={menuLink.href}
                className={`max-lg:hidden ${isActive ? 'link-primary' : 'link-neutral'} ${path === '/signin' && (menuLink.href === '/watch' || menuLink.href === '/request') ? 'hidden' : ''}`}
              >
                {menuLink.messagesKey}
              </Link>
            );
          })}
        <div className={`ms-auto flex gap-2 place-items-center`}>
          {path === '/' && (
            <Link
              href="/signup"
              id="signup"
              className={`btn btn-outline btn-sm md:btn-md text-xs btn-warning rounded-md gap-0.5 md:tracking-widest md:text-lg uppercase no-animation transition-opacity duration-500 ${path === '/' && !isInView && 'opacity-0 pointer-events-none'}`}
            >
              Sign up now
            </Link>
          )}
          {path != '/signin' && path != '/watch' && (
            <Link
              href="/signin"
              id="signin"
              className="btn btn-sm md:btn-md text-xs btn-primary rounded-md gap-0.5 md:tracking-widest uppercase md:text-lg hover:btn-secondary print:hidden"
            >
              Sign in{' '}
              <ArrowRightEndOnRectangleIcon className="size-4 md:size-6" />
            </Link>
          )}
        </div>
      </div>
      <div className="drawer-side">
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
          {MenuLinks.map((menuLink) => {
            const isActive = path.includes(menuLink.href);
            return (
              <li className="" key={menuLink.href}>
                <Link
                  href={menuLink.href}
                  className={`text-lg active:!bg-primary/20 ${isActive ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'} ${path === '/signin' && (menuLink.href === '/watch' || menuLink.href === '/request') ? 'hidden' : ''}`}
                >
                  {menuLink.icon}
                  {menuLink.messagesKey}
                </Link>
              </li>
            );
          })}
          <li>
            <details className="group">
              <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
                <FilmIcon className="w-7 h-7" /> Movies
              </summary>
              <ul>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Movies
                  </a>
                </li>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Kids Movies
                  </a>
                </li>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Retro: Movies
                  </a>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <details className="group">
              <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
                <TvIcon className="w-7 h-7" /> TV Shows
              </summary>
              <ul>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    TV Shows
                  </a>
                </li>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Kids Shows
                  </a>
                </li>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Retro: TV Shows
                  </a>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <details className="group">
              <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
                <MusicalNoteIcon className="w-7 h-7 inline-flex" /> Music (beta)
              </summary>
              <ul>
                <li>
                  <a className="active:!bg-primary/20 text-zinc-300 hover:text-white">
                    Music
                  </a>
                </li>
              </ul>
            </details>
          </li>
          <li className="disabled cursor-default">
            <Link
              href={''}
              className="text-lg text-zinc-400 pointer-events-none cursor-default"
            >
              <VideoCameraIcon className="w-7 h-7 inline-flex" /> Live TV (TBA)
            </Link>
          </li>
          <li className="leading-none my-4 ">
            <a className="block active:!bg-primary/20" href="/request">
              <img
                className="h-10 w-auto"
                src="/external/os-logo_full.svg"
                alt="overseerr"
                title="Make a request"
              />
              <p className="ms-20 -mt-3">
                <small className="">Request &amp; Report</small>
              </p>
            </a>
          </li>
          <div className="mt-auto">
            <div className="bg-zinc-300/40 h-0.5 my-4"></div>
            <div className="flex flex-row place-content-end">
              <div className="dropdown dropdown-top dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="flex place-items-center px-2 py-1 gap-1 text-zinc-300 hover:text-white"
                >
                  <Cog6ToothIcon className="w-7 h-7" />{' '}
                  <ChevronUpIcon className="w-4 h-4" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-primary backdrop-blur-md bg-opacity-60 rounded-md z-[1] px-0 py-2 min-w-44 text-sm"
                >
                  <li className="p-2 ms-2 text-base uppercase">Options</li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none gap-1 pe-2 active:!bg-zinc-50/20">
                      <CalendarDaysIcon className="w-6 h-6" /> Release Schedule
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none gap-1 pe-2 active:!bg-zinc-50/20">
                      <PaperAirplaneIcon className="w-6 h-6" /> Invite a Friend
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none gap-1 pe-2 active:!bg-zinc-50/20">
                      <PresentationChartLineIcon className="w-6 h-6" />{' '}
                      Statistics
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none gap-1 pe-2 active:!bg-zinc-50/20">
                      <LockClosedIcon className="w-6 h-6" /> Admin Centre
                    </a>
                  </li>
                  <div className="bg-zinc-300/40 h-0.5 my-2"></div>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">FAQs</a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Help Centre
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Get Support
                    </a>
                  </li>
                </ul>
              </div>
              <div className="dropdown dropdown-top dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="flex place-items-center px-2 py-1 gap-1 text-zinc-300 hover:text-white"
                >
                  <WrenchIcon className="w-7 h-7 scale-x-[-1]" />{' '}
                  <ChevronUpIcon className="w-4 h-4" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-primary backdrop-blur-md bg-opacity-60 rounded-md z-[1] px-0 py-2 min-w-44 text-sm"
                >
                  <li className="p-2 ms-2 text-base uppercase">Settings</li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      General
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Quality
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">Player</a>
                  </li>
                  <div className="bg-zinc-300/40 h-0.5 my-2"></div>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Online Media Sources
                    </a>
                  </li>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Authorized Devices
                    </a>
                  </li>
                  <div className="bg-zinc-300/40 h-0.5 my-2"></div>
                  <li className="m-0 text-zinc-300 hover:text-white">
                    <a className="rounded-none active:!bg-zinc-50/20">
                      Log out of Streamarr
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ul>
      </div>
    </header>
  );
};

export default Header;
