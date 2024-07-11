'use client'
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { usePathname } from "next/navigation";

interface MenuLinksProps {
  href: string;
  messagesKey: string;
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/',
    messagesKey: 'Home'
  },
  {
    href: '/watch',
    messagesKey: 'Watch'
  },
  {
    href: '/request',
    messagesKey: 'Request'
  },
  {
    href: '/help',
    messagesKey: 'Help Centre'
  }
]

const Header = ({isInView = false}) => {
  const path = usePathname();

  return (
    <header id="top" className={`navbar sticky top-0 transition duration-500 ${!isInView && 'bg-brand-dark'} font-bold z-50`}>
      <div className="md:px-10 flex-1 gap-2 h-10">
		<Link href="/" className={`hover:brightness-75 transition-opacity duration-500 ${isInView && 'opacity-0 pointer-events-none'}`}>
			<img src="/logo_full.png" alt="logo" className="w-40 md:w-52 h-auto" />
		</Link>
    {(path != '/watch' && path != '/') && <div className="divider divider-horizontal divider-neutral mx-0"></div>}
    {(path != '/watch' && path != '/') && MenuLinks.map(menuLink => {
            const isActive = path === menuLink.href;
            return (
              <Link key={menuLink.href} href={menuLink.href} className={`${isActive ? 'link-primary' : 'link-neutral'} ${path === '/signin' && (menuLink.href === '/watch' || menuLink.href === '/request') ? 'hidden' : ''}`}>{menuLink.messagesKey}</Link>
            );
          })}
          <div className="ms-auto flex gap-2 place-items-center">
    <Link href="/signup" id="login" className={`btn btn-outline btn-sm md:btn-md text-xs btn-warning rounded-md gap-0.5 md:tracking-widest md:text-lg uppercase no-animation transition-opacity duration-500 ${((path === '/' && isInView) || path != '/' )&& 'opacity-0 pointer-events-none'}`}>Sign up now</Link>
		{(path != '/signin' && path != '/watch') && <Link href="/signin" id="signin" className="btn btn-sm md:btn-md text-xs btn-primary rounded-md gap-0.5 md:tracking-widest uppercase md:text-lg hover:btn-secondary">Sign in <ArrowRightEndOnRectangleIcon className="size-4 md:size-6"/></Link>}
    </div>
    </div>
	</header>
  )
}

export default Header;
