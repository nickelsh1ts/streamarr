'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface AdminRoute {
  text: string;
  content?: React.ReactNode;
  route: string;
  regex: RegExp;
  hidden?: boolean;
}

type AdminLinkProps = {
  tabType: 'default' | 'button';
  currentPath: string;
  route: string;
  regex: RegExp;
  hidden?: boolean;
  isMobile?: boolean;
  children: React.ReactNode;
};

const AdminLink = ({
  children,
  tabType,
  currentPath,
  route,
  regex,
  hidden = false,
  isMobile = false,
}: AdminLinkProps) => {
  if (hidden) {
    return null;
  }

  if (isMobile) {
    return <option value={route}>{children}</option>;
  }

  let linkClasses =
    'px-1 py-4 ml-8 text-sm font-medium leading-5 transition duration-300 border-b-2 whitespace-nowrap first:ml-0';
  let activeLinkColor = 'text-primary border-primary';
  let inactiveLinkColor =
    'text-primary-content/70 border-transparent hover:text-primary-content/60 hover:border-gray-400 focus:text-gray-300 focus:border-gray-400';

  if (tabType === 'button') {
    linkClasses =
      'px-3 py-2 text-sm font-medium transition duration-300 rounded-md whitespace-nowrap mx-2 my-1';
    activeLinkColor = 'bg-primary';
    inactiveLinkColor = 'bg-base-100 hover:bg-primary/50 focus:bg-primary/30';
  }

  return (
    <Link
      href={route}
      className={`${linkClasses} ${
        currentPath.match(regex) ? activeLinkColor : inactiveLinkColor
      }`}
      aria-current="page"
    >
      {children}
    </Link>
  );
};

const AdminTabs = ({
  tabType = 'default',
  AdminRoutes,
}: {
  tabType?: 'default' | 'button';
  AdminRoutes: AdminRoute[];
}) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a Tab
        </label>
        <select
          className="select select-primary w-full"
          onChange={(e) => {
            router.push(e.target.value);
          }}
          onBlur={(e) => {
            router.push(e.target.value);
          }}
          value={
            AdminRoutes.find((route) => !!pathname.match(route.regex))?.route
          }
          aria-label="Selected Tab"
        >
          {AdminRoutes.filter((route) => !route.hidden).map((route, index) => (
            <AdminLink
              tabType={tabType}
              currentPath={pathname}
              route={route.route}
              regex={route.regex}
              hidden={route.hidden ?? false}
              isMobile
              key={`mobile-Admin-link-${index}`}
            >
              {route.text}
            </AdminLink>
          ))}
        </select>
      </div>
      {tabType === 'button' ? (
        <div className="hidden sm:block">
          <nav className="-mx-2 -my-1 flex flex-wrap" aria-label="Tabs">
            {AdminRoutes.map((route, index) => (
              <AdminLink
                tabType={tabType}
                currentPath={pathname}
                route={route.route}
                regex={route.regex}
                hidden={route.hidden ?? false}
                key={`button-Admin-link-${index}`}
              >
                {route.content ?? route.text}
              </AdminLink>
            ))}
          </nav>
        </div>
      ) : (
        <div className="hide-scrollbar hidden overflow-x-scroll border-b border-gray-600 sm:block m-0">
          <nav className="flex" data-testid="Admin-nav-desktop">
            {AdminRoutes.filter((route) => !route.hidden).map(
              (route, index) => (
                <AdminLink
                  tabType={tabType}
                  currentPath={pathname}
                  route={route.route}
                  regex={route.regex}
                  key={`standard-Admin-link-${index}`}
                >
                  {route.text}
                </AdminLink>
              )
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default AdminTabs;
