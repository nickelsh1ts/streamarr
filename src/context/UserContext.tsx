'use client';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import { publicRoutes } from '@app/proxy';
import { socket } from '@app/utils/webSocket';
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
  const { user, error } = useUser({
    initialData: initialUser,
  });
  const routing = useRef(false);
  const router = useRouter();

  const buildSigninRedirect = () => {
    const { pathname: currentPath, search, hash } = window.location;
    return (
      '/signin?redirect_url=' + encodeURIComponent(currentPath + search + hash)
    );
  };

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (e) => {
        if (
          e.response?.status === 401 &&
          !routing.current &&
          window.location.pathname !== '/logout' &&
          !publicRoutes.test(window.location.pathname)
        ) {
          routing.current = true;
          router.replace(buildSigninRedirect());
        }
        return Promise.reject(e);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [router]);

  useEffect(() => {
    const handleSessionRevoked = async () => {
      routing.current = true;
      try {
        // A newer sign-in in this browser is still valid; just reconnect
        const { data } = await axios.get<User>('/api/v1/auth/me');
        if (data.id !== user?.id) {
          // Signed in as another account elsewhere, so drop this tab's cached identity
          window.location.reload();
          return;
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          router.replace('/logout');
          return;
        }
        // Other failures don't prove revocation; a later 401 still signs this tab out
      }
      routing.current = false;
      socket.connect();
    };

    socket.on('sessionRevoked', handleSessionRevoked);
    return () => {
      socket.off('sessionRevoked', handleSessionRevoked);
    };
  }, [router, user?.id]);

  // The server disconnects revoked sessions, so a later sign-in needs a new connection
  useEffect(() => {
    if (user?.id && socket.disconnected) {
      socket.connect();
    }
  }, [user?.id]);

  useEffect(() => {
    // Don't redirect during setup process, signin, or on public routes
    const isSetupPage = pathname === '/setup';
    const isPublicRoute = publicRoutes.test(pathname);
    // /logout manages its own redirect once it finishes clearing the session
    const isLogoutPage = pathname === '/logout';

    if (isPublicRoute) {
      routing.current = false;
      return;
    }

    if (!isSetupPage && !isLogoutPage && (!user || error) && !routing.current) {
      routing.current = true;
      router.replace(buildSigninRedirect());
    }
  }, [pathname, user, error, router]);

  return <>{children}</>;
};
