import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import type { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { EventSubscriber, In } from 'typeorm';
import { getRepository } from '@server/datasource';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import { NotificationAgentKey } from '@server/lib/settings';
import notificationManager from '@server/lib/notifications';
import logger from '@server/logger';
import type { NotificationPayload } from '@server/lib/notifications/agents/agent';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  public listenTo(): typeof User {
    return User;
  }
  private async sendNewUserNotification(entity: User) {
    const userRepository = getRepository(User);

    const permittedUsers = await userRepository.find({
      where: {
        permissions: In([Permission.MANAGE_USERS, Permission.ADMIN]),
      },
      relations: ['settings'],
    });

    const usersToNotify = permittedUsers.filter((user) => {
      const settings = user.settings;
      return (
        !settings ||
        settings.hasNotificationType(
          NotificationAgentKey.IN_APP,
          NotificationType.USER_CREATED
        ) ||
        settings.hasNotificationType(
          NotificationAgentKey.EMAIL,
          NotificationType.USER_CREATED
        ) ||
        settings.hasNotificationType(
          NotificationAgentKey.WEBPUSH,
          NotificationType.USER_CREATED
        )
      );
    });

    if (usersToNotify.length === 0 || entity.id === 1) {
      return;
    }

    await Promise.all(
      usersToNotify.map(async (user) => {
        try {
          const payload: NotificationPayload = {
            subject: `New User Created: ${entity.displayName}`,
            message: entity.redeemedInvite
              ? `Invited by ${entity.redeemedInvite?.createdBy.displayName}.`
              : '',
            notifySystem: false,
            notifyAdmin: false,
            notifyUser: user,
            actionUrl: '/admin/users',
            actionUrlTitle: 'View Users',
            severity: NotificationSeverity.PRIMARY,
          };

          notificationManager.sendNotification(
            NotificationType.USER_CREATED,
            payload
          );
        } catch (e) {
          logger.error('Failed to send new user notification', {
            label: 'Notifications',
            errorMessage: e.message,
            newUser: entity.displayName,
            newUserId: entity.id,
          });
        }
      })
    );
  }

  public async afterInsert(event: InsertEvent<User>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const userRepository = getRepository(User);
    const fullEntity = await userRepository.findOne({
      where: { id: event.entity.id },
      relations: ['redeemedInvite', 'redeemedInvite.createdBy'],
    });

    if (fullEntity) {
      await this.sendNewUserNotification(fullEntity);
    }
  }
}
