import { getRepository } from '@server/datasource';
import Notification from '@server/entity/Notification';
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
    let deletedCount = 0;
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // Notifications older than 1 year

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
