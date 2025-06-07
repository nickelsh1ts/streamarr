'use server';
import { createSession } from '@app/lib/session';
import { redirect } from 'next/navigation';
import { deleteSession } from '@app/lib/session';

export async function auth(userid: string, isAdmin: boolean) {
  await createSession(userid, isAdmin);
  redirect('/watch/web/index.html');
}

export async function logout() {
  await deleteSession();
  redirect('/');
}
