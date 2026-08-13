import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const SETUP_REGEX = /\/(setup|signin\/plex\/loading)/;
export const publicRoutes =
  /(\/|signin(\/plex\/loading)?|signup|resetpassword\/?(.*)?|setup|signin(\/plex\/loading)?|help\/?(.*)?)$/;

const SESSION_COOKIE = 'streamarr.sid';

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

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

  // Public routes are reachable without a session.
  if (publicRoutes.test(pathname)) {
    return NextResponse.next();
  }

  if (!req.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|img/|external/|.*\\.png$).*)'],
};
