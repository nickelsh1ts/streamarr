'use server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decrypt } from '@app/lib/session';
import { cookies } from 'next/headers';

// 1. Specify protected and public routes
export const protectedRoutes =
  /^\/(watch\/?(.*)?|invites|logout|profile\/?(.*)?|request\/?(.*)?|schedule)\/?$/;
export const publicRoutes = /^(\/|\/signin|\/signup)$/;
export const AdminRoutes = /^\/admin\/?(.*)?\/?$/;

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = path.match(protectedRoutes);
  const isPublicRoute = path.match(publicRoutes);
  const isAdminRoute = path.match(AdminRoutes);

  // 3. Decrypt the session from the cookie
  const cookie = (await cookies()).get(
    `my${process.env.NEXT_PUBLIC_APP_NAME}Session`
  )?.value;
  const session = await decrypt(cookie);

  // 4. Redirect to /signin if the user is not authenticated
  if ((isProtectedRoute || isAdminRoute) && !session?.userId) {
    return NextResponse.redirect(new URL('/signin', req.nextUrl));
  }

  if (isAdminRoute && session?.userId && !session?.admin) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
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
