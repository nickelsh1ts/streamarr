import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const SETUP_REGEX = /\/(setup|signin\/plex\/loading)/;
export const publicRoutes =
  /(\/|signin(\/plex\/loading)?|signup|resetpassword\/?(.*)?|setup|signin(\/plex\/loading)?|help\/?(.*)?)$/;

const SESSION_COOKIE = 'streamarr.sid';

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

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
  if (
    publicRoutes.test(pathname) ||
    pathname.startsWith('/watch/web/index.html')
  ) {
    return NextResponse.next();
  }

  if (!req.cookies.get(SESSION_COOKIE)) {
    const url = new URL('/signin', req.url);
    const redirectUrl = pathname + search;

    url.searchParams.set('redirect_url', redirectUrl);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|img/|external/|.*\\.png$).*)'],
};
