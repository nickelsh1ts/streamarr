import ical from 'ical';
import axios from 'axios';
import { getSettings } from '@server/lib/settings';
import cacheManager from '@server/lib/cache';
import type { SonarrSettings, RadarrSettings } from '@server/lib/settings';
import logger from '@server/logger';

export interface CalendarEvent {
  type: 'VEVENT';
  start: Date;
  end?: Date;
  summary?: string;
  [key: string]: unknown;
}

function buildCalendarUrl(
  settings: SonarrSettings | RadarrSettings,
  type: 'sonarr' | 'radarr'
): string {
  const protocol = settings.useSsl ? 'https' : 'http';
  const host = settings.hostname;
  const port = settings.port;
  const basePath = settings.baseUrl ? settings.baseUrl.replace(/\/$/, '') : '';
  const apiKey = settings.apiKey;
  const calendarFile = type === 'sonarr' ? 'Sonarr.ics' : 'Radarr.ics';
  return `${protocol}://${host}:${port}${basePath}/feed/v3/calendar/${calendarFile}?apikey=${apiKey}`;
}

export async function getOrFetchCalendar(
  type: 'sonarr' | 'radarr',
  maxAgeMs = 60 * 60 * 1000 // 1 hour
): Promise<CalendarEvent[]> {
  const cache = cacheManager.getCache(type).data;
  const cacheKey = 'calendarEvents';
  const cached = cache.get<CalendarEvent[]>(cacheKey);
  if (cached) return cached;
  try {
    const settings = getSettings();
    const instances = type === 'sonarr' ? settings.sonarr : settings.radarr;
    if (!instances || !Array.isArray(instances)) return [];
    // Filter for sync-enabled instances
    const enabledInstances = instances.filter((inst) => inst.syncEnabled);
    if (enabledInstances.length === 0) return [];
    // Fetch and combine events from all enabled instances
    const allEvents: CalendarEvent[] = [];
    for (const instanceSettings of enabledInstances) {
      try {
        const url = buildCalendarUrl(instanceSettings, type);
        const response = await axios.get(url, { responseType: 'text' });
        const data = response.data;
        const parsed = ical.parseICS(data);
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
            errorMessage: e.message,
          }
        );
      }
    }
    cache.set(cacheKey, allEvents, maxAgeMs / 1000);
    return allEvents;
  } catch (e) {
    logger.error(`Failed to fetch ${type} calendar.`, {
      label: 'Calendar',
      errorMessage: e.message,
    });
    return [];
  }
}
