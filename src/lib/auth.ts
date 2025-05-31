'use server';
import { createSession } from '@app/lib/session';
import { redirect } from 'next/navigation';
import { deleteSession } from '@app/lib/session';

export async function signin(userid: string) {
  await createSession(userid);
  redirect('/watch/web/index.html');
}

export async function logout() {
  await deleteSession();
  redirect('/');
}
