'use server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decrypt } from '@app/lib/session';
import { cookies } from 'next/headers';

// 1. Specify protected and public routes
export const protectedRoutes =
  /^\/(watch\/?(.*)?|invites|logout|admin\/?(.*)?|profile\/?(.*)?|request\/?(.*)?|schedule)\/?$/;
export const publicRoutes = /^(\/|\/signin|\/signup|\/help\/?(.*)?)$/;

///signin', '/signup', '/', '/help', '/setup

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = path.match(protectedRoutes);
  const isPublicRoute = path.match(publicRoutes);

  // 3. Decrypt the session from the cookie
  const cookie = (await cookies()).get('myStreamarrSession')?.value;
  const session = await decrypt(cookie);

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/signin', req.nextUrl));
  }

  // 5. Redirect to /watch if the user is authenticated
  if (
    isPublicRoute &&
    session?.userId &&
    !req.nextUrl.pathname.startsWith('/watch')
  ) {
    return NextResponse.redirect(new URL('/watch', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
