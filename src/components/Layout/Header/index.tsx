'use client';
import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuLinksProps {
  href: string;
  messagesKey: string;
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/help',
    messagesKey: 'Help Centre',
  },
];

const Header = ({ isInView = false }) => {
  const path = usePathname();

  return (
    <header
      id="top"
      className={`navbar ${path === '/' && 'sticky top-0'} transition duration-500 drawer ${!isInView && 'bg-brand-dark'} font-bold z-10`}
    >
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content md:px-10 flex-1 max-sm:flex-wrap max-sm:place gap-2 min-h-10">
        {path != '/' && (
          <div className="flex-none max-md:hidden lg:hidden print:hidden">
            <label
              htmlFor="my-drawer-3"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
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
          className={`hover:brightness-75 transition-opacity duration-500 ${isInView && 'opacity-0 pointer-events-none'}`}
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
              className={`btn btn-outline btn-sm md:btn-md text-xs btn-warning rounded-md gap-0.5 md:tracking-widest md:text-lg uppercase no-animation transition-opacity duration-500 ${path === '/' && isInView && 'opacity-0 pointer-events-none'}`}
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
        ></label>
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          {MenuLinks.map((menuLink) => {
            const isActive = path.includes(menuLink.href);
            return (
              <li key={menuLink.href}>
                <Link
                  href={menuLink.href}
                  className={`${isActive ? 'link-primary' : 'link-neutral'} ${path === '/signin' && (menuLink.href === '/watch' || menuLink.href === '/request') ? 'hidden' : ''}`}
                >
                  {menuLink.messagesKey}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Header;
