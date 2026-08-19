import { getRepository } from '@server/datasource';
import Notification from '@server/entity/Notification';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { LessThan } from 'typeorm';

class CleanUpNotifications {
  private isRunning = false;

  public status(): { running: boolean } {
    return { running: this.isRunning };
  }

  public cancel(): void {
    this.isRunning = false;
  }

  public async run() {
    if (this.isRunning) {
      logger.warn(
        'Clean up notifications job is already running, skipping duplicate run.',
        {
          label: 'Jobs',
        }
      );
      return;
    }

    this.isRunning = true;

    const notificationRepository = getRepository(Notification);
    const cutoffDate = new Date();
    const settings = getSettings().notifications.agents.inApp.options;

    const retentionLimit = Number(settings.retentionLimit);
    const retentionTime = settings.retentionTime ?? 'years';

    if (!Number.isFinite(retentionLimit) || retentionLimit <= 0) {
      cutoffDate.setTime(0);
    } else {
      switch (retentionTime) {
        case 'days':
          cutoffDate.setDate(cutoffDate.getDate() - retentionLimit);
          break;
        case 'weeks':
          cutoffDate.setDate(cutoffDate.getDate() - retentionLimit * 7);
          break;
        case 'months':
          cutoffDate.setMonth(cutoffDate.getMonth() - retentionLimit);
          break;
        case 'years':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionLimit);
          break;
        default:
          logger.warn(
            `Unknown notification retentionTime "${String(settings.retentionTime)}"; defaulting to years.`,
            { label: 'Jobs' }
          );
          cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionLimit);
      }
    }
    let deletedCount = 0;

    try {
      if (!this.isRunning) {
        logger.info('Clean up notifications job cancelled.', {
          label: 'Jobs',
        });
        return;
      }
      const deleted = await notificationRepository.delete({
        createdAt: LessThan(cutoffDate),
      });
      deletedCount = deleted.affected || 0;
    } catch (e) {
      logger.error(`Error cleaning up notifications`, {
        label: 'Jobs',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    } finally {
      this.isRunning = false;
    }

    logger.info(`Cleaned up ${deletedCount} old notification(s).`, {
      label: 'Jobs',
    });
  }
}

const cleanUpNotifications = new CleanUpNotifications();
export default cleanUpNotifications;
