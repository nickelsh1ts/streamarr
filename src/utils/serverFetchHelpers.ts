import type { PublicSettingsResponse } from '@server/interfaces/api/settingsInterfaces';
import type { Metadata } from 'next';

const DEFAULT_TITLE = 'Streamarr';
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

export async function getPublicSettings(): Promise<PublicSettingsResponse> {
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

export async function generatePageMetadata(prefix: string): Promise<Metadata> {
  const settings = await getPublicSettings();
  return { title: `${prefix} - ${settings.applicationTitle}` };
}
