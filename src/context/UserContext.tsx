'use client';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import { publicRoutes } from '@app/proxy';
import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
  const isAuthPage = /^\/(signin|signup|setup|resetpassword(?:\/|$))/.test(
    pathname || ''
  );
  const { user, error } = useUser({
    initialData: initialUser,
    disableAutoRevalidation: isAuthPage,
  });
  const routing = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (e) => {
        if (
          e.response?.status === 401 &&
          !routing.current &&
          !publicRoutes.test(window.location.pathname)
        ) {
          routing.current = true;
          router.replace('/signin');
        }
        return Promise.reject(e);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [router]);

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
      router.replace('/signin');
    }
  }, [pathname, user, error, router]);

  return <>{children}</>;
};
