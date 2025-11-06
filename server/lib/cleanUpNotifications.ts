import { getRepository } from '@server/datasource';
import Notification from '@server/entity/Notification';
import logger from '@server/logger';
import { LessThan } from 'typeorm';

class CleanUpNotifications {
  public async run() {
    const notificationRepository = getRepository(Notification);
    const cutoffDate = new Date();

    let deletedCount = 0;
    let orphanedCount = 0;
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // Notifications older than 1 year

    try {
      const deleted = await notificationRepository.delete({
        createdAt: LessThan(cutoffDate),
      });
      deletedCount = deleted.affected || 0;
      const orphaned = await notificationRepository.delete({
        createdBy: null,
      });
      orphanedCount = orphaned.affected || 0;
    } catch (e) {
      logger.error(`Error cleaning up notifications`, {
        label: 'Jobs',
        errorMessage: e.message,
      });
    }

    logger.info(
      `Cleaned up ${deletedCount} old and ${orphanedCount} orphaned notification(s).`,
      {
        label: 'Jobs',
      }
    );
  }
}

const cleanUpNotifications = new CleanUpNotifications();
export default cleanUpNotifications;
