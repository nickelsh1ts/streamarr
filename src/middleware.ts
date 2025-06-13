import { type User } from '@app/hooks/useUser';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const SETUP_REGEX = /\/(setup|signin\/plex\/loading)/;
export const publicRoutes =
  /(\/|signin(\/plex\/loading)?|signup|resetpassword|setup|signin(\/plex\/loading)?|help\/?(.*)?)$/;

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicRoute = pathname.match(publicRoutes);

  // Always allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/offline.html') ||
    pathname.startsWith('/img') ||
    pathname.startsWith('/external')
  ) {
    return NextResponse.next();
  }

  const response = await axios.get<PublicSettingsResponse>(
    `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`
  );

  const initialized = response.data.initialized;
  let user: User | undefined = undefined;

  // If not initialized, redirect to /setup unless already there
  if (!initialized) {
    if (!SETUP_REGEX.test(pathname)) {
      return NextResponse.redirect(new URL('/setup', req.nextUrl));
    }
  } else {
    try {
      const response = await axios.get<User>(
        `http://${process.env.HOST || 'localhost'}:${
          process.env.PORT || 3000
        }/api/v1/auth/me`,
        {
          headers: { cookie: req.headers.get('cookie') || undefined },
        }
      );
      user = response.data;

      // If authenticated and on index/setup/login, redirect to /watch
      if (user && (SETUP_REGEX.test(pathname) || pathname.match(/\/$/))) {
        return NextResponse.redirect(new URL('/watch', req.nextUrl));
      }
    } catch {
      // If not authenticated and not on login/setup/resetpassword, redirect to /login
      if (!isPublicRoute || (pathname.match(/setup/) && initialized)) {
        return NextResponse.redirect(new URL('/signin', req.nextUrl));
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|img/|external/|.*\\.png$).*)'],
};
