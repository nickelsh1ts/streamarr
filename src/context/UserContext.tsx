'use client';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import { publicRoutes } from '@app/middleware';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface UserContextProps {
  initialUser: User;
  children?: React.ReactNode;
}

/**
 * This UserContext serves the purpose of just preparing the useUser hooks
 * cache on server side render. It also will handle redirecting the user to
 * the login page if their session ever becomes invalid.
 */
export const UserContext = ({ initialUser, children }: UserContextProps) => {
  const { user, error, revalidate } = useUser({ initialData: initialUser });
  const pathname = usePathname();
  const routing = useRef(false);

  useEffect(() => {
    revalidate();
  }, [pathname, revalidate]);

  useEffect(() => {
    // Don't redirect during setup process, signin, or on public routes
    const isSetupPage = pathname === '/setup';
    const isPublicRoute = publicRoutes.test(pathname);

    if (
      !isSetupPage &&
      !isPublicRoute &&
      (!user || error) &&
      !routing.current
    ) {
      routing.current = true;
      location.href = '/signin';
    }
  }, [pathname, user, error]);

  return <>{children}</>;
};
