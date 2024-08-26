'use client';
import {
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuLinksProps {
  href: string;
  messagesKey: string;
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/help',
    messagesKey: 'Help Centre'
  },
];

const Header = ({ isInView = true }) => {
  const path = usePathname();

  return (
    <header
      id="top"
      className={`navbar ${path === '/' && 'sticky top-0'} transition duration-500 ${isInView && 'bg-brand-dark'} font-bold z-10`}
    >
      <div className="md:px-10 flex-1 max-sm:flex-wrap max-sm:place gap-2 min-h-10">
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
        { path != '/' && (
          <div className="divider divider-horizontal divider-neutral mx-0 max-md:hidden"></div>
        )}
        {path != '/' &&
          MenuLinks.map((menuLink) => {
            const isActive = path.includes(menuLink.href);
            return (
              <Link
                key={menuLink.href}
                href={menuLink.href}
                className={`max-md:hidden ${isActive ? 'link-primary' : 'link-neutral'} ${path === '/signin' && (menuLink.href === '/request') ? 'hidden' : ''}`}
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
          {path != '/signin' && (
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
    </header>
  );
};

export default Header;
