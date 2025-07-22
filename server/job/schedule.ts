import ImageProxy from '@server/lib/imageproxy';
import refreshToken from '@server/lib/refreshToken';
import { plexFullScanner } from '@server/lib/scanners/plex';
import type { JobId } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import schedule from 'node-schedule';
import expiredInvites from '@server/lib/expiredInvites';

interface ScheduledJob {
  id: JobId;
  job: schedule.Job;
  name: string;
  type: 'process' | 'command';
  interval: 'seconds' | 'minutes' | 'hours' | 'fixed';
  cronSchedule: string;
  running?: () => boolean;
  cancelFn?: () => void;
}

export const scheduledJobs: ScheduledJob[] = [];

export const startJobs = (): void => {
  const jobs = getSettings().jobs;

  // Run full plex scan every 24 hours
  scheduledJobs.push({
    id: 'plex-full-scan',
    name: 'Plex Full Library Scan',
    type: 'process',
    interval: 'hours',
    cronSchedule: jobs['plex-full-scan'].schedule,
    job: schedule.scheduleJob(jobs['plex-full-scan'].schedule, () => {
      logger.info('Starting scheduled job: Plex Full Library Scan', {
        label: 'Jobs',
      });
      plexFullScanner.run();
    }),
    running: () => plexFullScanner.status().running,
    cancelFn: () => plexFullScanner.cancel(),
  });

  // Run image cache cleanup every 24 hours
  scheduledJobs.push({
    id: 'image-cache-cleanup',
    name: 'Image Cache Cleanup',
    type: 'process',
    interval: 'hours',
    cronSchedule: jobs['image-cache-cleanup'].schedule,
    job: schedule.scheduleJob(jobs['image-cache-cleanup'].schedule, () => {
      logger.info('Starting scheduled job: Image Cache Cleanup', {
        label: 'Jobs',
      });
      // Clean TMDB image cache
      ImageProxy.clearCache('tmdb');
    }),
  });

  scheduledJobs.push({
    id: 'plex-refresh-token',
    name: 'Plex Refresh Token',
    type: 'process',
    interval: 'fixed',
    cronSchedule: jobs['plex-refresh-token'].schedule,
    job: schedule.scheduleJob(jobs['plex-refresh-token'].schedule, () => {
      logger.info('Starting scheduled job: Plex Refresh Token', {
        label: 'Jobs',
      });
      refreshToken.run();
    }),
  });

  // Run expired invites cleanup every 24 hours
  scheduledJobs.push({
    id: 'invites-qrcode-cleanup',
    name: 'Invite & QR Code Cleanup',
    type: 'process',
    interval: 'hours',
    cronSchedule: jobs['invites-qrcode-cleanup']?.schedule,
    job: schedule.scheduleJob(jobs['invites-qrcode-cleanup']?.schedule, () => {
      logger.info('Starting scheduled job: Expired Invite and QR Cleanup', {
        label: 'Jobs',
      });
      expiredInvites.run();
    }),
  });

  logger.info('Scheduled jobs loaded', { label: 'Jobs' });
};
