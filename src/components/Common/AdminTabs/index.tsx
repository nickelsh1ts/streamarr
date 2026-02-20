'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

export interface AdminRoute {
  text: string;
  content?: React.ReactNode;
  route: string;
  regex: RegExp;
  hidden?: boolean;
  dataTutorial?: string;
}

type AdminLinkProps = {
  tabType: 'default' | 'button';
  currentPath: string;
  route: string;
  regex: RegExp;
  hidden?: boolean;
  isMobile?: boolean;
  dataTutorial?: string;
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
  dataTutorial,
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
    'text-base-content/70 border-transparent hover:text-base-content/60 hover:border-neutral focus:text-neutral focus:border-neutral';

  if (tabType === 'button') {
    linkClasses =
      'px-3 py-2 text-sm font-medium transition duration-300 rounded-md whitespace-nowrap mx-2 my-1';
    activeLinkColor = 'bg-primary text-primary-content';
    inactiveLinkColor =
      'bg-base-100 hover:bg-primary/50 focus:bg-primary/30 text-base-content hover:text-primary-content focus:text-primary-content';
  }

  return (
    <Link
      href={route}
      className={`${linkClasses} ${
        currentPath.match(regex) ? activeLinkColor : inactiveLinkColor
      }`}
      aria-current="page"
      data-tutorial={dataTutorial}
    >
      {children}
    </Link>
  );
};

const AdminTabs = ({
  tabType = 'default',
  AdminRoutes,
  dataTutorial = 'admin-tabs',
}: {
  tabType?: 'default' | 'button';
  AdminRoutes: AdminRoute[];
  dataTutorial?: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          <FormattedMessage
            id="common.selectTab"
            defaultMessage="Select a Tab"
          />
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
          <nav
            className="-mx-2 -my-1 flex flex-wrap"
            aria-label="Tabs"
            data-tutorial={dataTutorial}
          >
            {AdminRoutes.map((route, index) => (
              <AdminLink
                tabType={tabType}
                currentPath={pathname}
                route={route.route}
                regex={route.regex}
                hidden={route.hidden ?? false}
                dataTutorial={route.dataTutorial}
                key={`button-Admin-link-${index}`}
              >
                {route.content ?? route.text}
              </AdminLink>
            ))}
          </nav>
        </div>
      ) : (
        <div className="hide-scrollbar hidden overflow-x-scroll border-b border-neutral sm:block m-0">
          <nav
            className="flex"
            data-testid="Admin-nav-desktop"
            data-tutorial={dataTutorial}
          >
            {AdminRoutes.filter((route) => !route.hidden).map(
              (route, index) => (
                <AdminLink
                  tabType={tabType}
                  currentPath={pathname}
                  route={route.route}
                  regex={route.regex}
                  dataTutorial={route.dataTutorial}
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
