import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const SETUP_REGEX = /\/(setup|signin\/plex\/loading)/;
export const publicRoutes =
  /(\/|signin(\/plex\/loading)?|signup|resetpassword|setup|signin(\/plex\/loading)?|help\/?(.*)?)$/;

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|img/|external/|.*\\.png$).*)'],
};
