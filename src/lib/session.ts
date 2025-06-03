'use server';
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.log('Failed to verify session');
  }
}

export async function updateSession(admin: boolean) {
  const session = (await cookies()).get('myStreamarrSession')?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  if (payload?.admin === admin) {
    return null;
  }

  const userId = payload?.userId;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newSession = await encrypt({ userId, admin, expires });

  const cookieStore = await cookies();
  cookieStore.set('myStreamarrSession', newSession, {
    httpOnly: true,
    secure: true,
    expires: expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function createSession(userId: string, admin: boolean) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, admin, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set('myStreamarrSession', session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('myStreamarrSession');
}
