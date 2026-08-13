import type { User } from '@app/hooks/useUser';
import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { cache } from 'react';

const DEFAULT_TITLE = 'Streamarr';
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

export const getPublicSettings = cache(
  async (): Promise<PublicSettingsResponse> => {
    const url = `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 3000
    }/api/v1/settings/public`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // fetch failed — retry unless exhausted
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }
    }

    return {
      applicationTitle: DEFAULT_TITLE,
    } as PublicSettingsResponse;
  }
);

/**
 * Resolves the current user server-side from the request session cookie via
 * the internal /auth/me endpoint. Wrapped in React `cache` so the layout,
 * page-level redirect gate, and metadata all share a single request-scoped
 * fetch. Returns undefined for unauthenticated or failed lookups.
 */
export const getServerUser = cache(async (): Promise<User | undefined> => {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    const res = await fetch(
      `http://${process.env.HOST || 'localhost'}:${
        process.env.PORT || 3000
      }/api/v1/auth/me`,
      {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
      }
    );
    if (res.ok) {
      return (await res.json()) as User;
    }
  } catch {
    // ignore — treated as unauthenticated
  }
  return undefined;
});

export async function generatePageMetadata(prefix: string): Promise<Metadata> {
  const settings = await getPublicSettings();
  return { title: `${prefix} - ${settings.applicationTitle}` };
}
