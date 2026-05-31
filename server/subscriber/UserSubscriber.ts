import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import type { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { EventSubscriber } from 'typeorm';
import { getRepository } from '@server/datasource';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import { userAcceptsNotificationType } from '@server/lib/notifications';
import { sendGroupNotification } from '@server/lib/notifications/dispatch';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  public listenTo(): typeof User {
    return User;
  }
  private async sendNewUserNotification(entity: User) {
    // Skip notifications if this is the admin user (ID 1) being created
    if (entity.id === 1) {
      return;
    }

    const userRepository = getRepository(User);

    const allUsers = await userRepository.find({ relations: ['settings'] });

    const usersToNotify = allUsers.filter((user) => {
      if (
        user.id === entity.id ||
        !user.hasPermission([Permission.MANAGE_USERS, Permission.ADMIN], {
          type: 'or',
        })
      ) {
        return false;
      }

      return userAcceptsNotificationType(user, NotificationType.USER_CREATED);
    });

    await sendGroupNotification(
      NotificationType.USER_CREATED,
      usersToNotify,
      (intl) => ({
        subject: intl.formatMessage(
          {
            id: 'notifications.user.created.subject',
            defaultMessage: 'New User Created: {displayName}',
          },
          { displayName: entity.displayName }
        ),
        message: entity.redeemedInvite?.createdBy
          ? intl.formatMessage(
              {
                id: 'notifications.user.created.message',
                defaultMessage: 'Invited by {displayName}.',
              },
              { displayName: entity.redeemedInvite.createdBy.displayName }
            )
          : '',
        actionUrl: '/admin/users',
        actionUrlTitle: 'View Users',
        severity: NotificationSeverity.PRIMARY,
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
