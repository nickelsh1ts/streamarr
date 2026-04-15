import ical from 'ical';
import axios from 'axios';
import { getSettings } from '@server/lib/settings';
import type { SonarrSettings, RadarrSettings } from '@server/lib/settings';
import logger from '@server/logger';

export interface CalendarEvent {
  type: 'VEVENT';
  start: Date;
  end?: Date;
  summary?: string;
  [key: string]: unknown;
}

const calendarCache: Record<'sonarr' | 'radarr', CalendarEvent[] | undefined> =
  {
    sonarr: undefined,
    radarr: undefined,
  };

const revalidating: Record<'sonarr' | 'radarr', boolean> = {
  sonarr: false,
  radarr: false,
};

function buildCalendarUrl(
  settings: SonarrSettings | RadarrSettings,
  type: 'sonarr' | 'radarr'
): string {
  const protocol = settings.useSsl ? 'https' : 'http';
  const host = settings.hostname;
  const port = settings.port;
  const basePath = settings.baseUrl ? settings.baseUrl.replace(/\/$/, '') : '';
  const apiKey = settings.apiKey;
  const pastDays = settings.pastDays ?? 7;
  const futureDays = settings.futureDays ?? 28;
  const calendarFile = type === 'sonarr' ? 'Sonarr.ics' : 'Radarr.ics';
  return `${protocol}://${host}:${port}${basePath}/feed/v3/calendar/${calendarFile}?apikey=${apiKey}&pastDays=${pastDays}&futureDays=${futureDays}`;
}

async function fetchCalendar(
  type: 'sonarr' | 'radarr'
): Promise<CalendarEvent[]> {
  const settings = getSettings();
  const instances = type === 'sonarr' ? settings.sonarr : settings.radarr;
  if (!instances || !Array.isArray(instances)) return [];
  const enabledInstances = instances.filter((inst) => inst.syncEnabled);
  if (enabledInstances.length === 0) return [];

  const allEvents: CalendarEvent[] = [];
  for (const instanceSettings of enabledInstances) {
    try {
      const url = buildCalendarUrl(instanceSettings, type);
      const response = await axios.get(url, { responseType: 'text' });
      const parsed = ical.parseICS(response.data);
      const events = Object.values(parsed).filter(
        (event) =>
          typeof event === 'object' &&
          event !== null &&
          (event as { type?: unknown }).type === 'VEVENT' &&
          (event as { start?: unknown }).start instanceof Date
      ) as CalendarEvent[];
      allEvents.push(...events);
    } catch (e) {
      logger.error(
        `Failed to fetch ${type} calendar for instance: ${instanceSettings.hostname}`,
        {
          label: 'Calendar',
          errorMessage: e instanceof Error ? e.message : String(e),
        }
      );
    }
  }
  return allEvents;
}

export async function revalidateCalendar(
  type: 'sonarr' | 'radarr'
): Promise<void> {
  if (revalidating[type]) return;
  revalidating[type] = true;
  try {
    const fresh = await fetchCalendar(type);
    // Only replace the cache when the content has actually changed
    if (JSON.stringify(fresh) !== JSON.stringify(calendarCache[type])) {
      calendarCache[type] = fresh;
    }
  } catch (e) {
    logger.error(`Failed to revalidate ${type} calendar.`, {
      label: 'Calendar',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  } finally {
    revalidating[type] = false;
  }
}

export async function getCalendarData(
  type: 'sonarr' | 'radarr'
): Promise<CalendarEvent[]> {
  if (calendarCache[type] !== undefined) {
    void revalidateCalendar(type);
    return calendarCache[type]!;
  }
  // Cold cache — wait for first fetch
  await revalidateCalendar(type);
  return calendarCache[type] ?? [];
}
