'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { decrypt } from '@app/lib/session';
import { cache } from 'react';

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get(
    `my${process.env.NEXT_PUBLIC_APP_NAME}Session`
  )?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return { isAuthed: false, userId: null };
  }

  return { isAuthed: true, userId: session.userId };
});
