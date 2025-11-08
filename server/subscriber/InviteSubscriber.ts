import { InviteStatus } from '@server/constants/invite';
import { NotificationType } from '@server/constants/notification';
import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import { User } from '@server/entity/User';
import notificationManager from '@server/lib/notifications';
import { Permission } from '@server/lib/permissions';
import { NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber, In, Not } from 'typeorm';

@EventSubscriber()
export class InviteSubscriber implements EntitySubscriberInterface<Invite> {
  public listenTo(): typeof Invite {
    return Invite;
  }

  private async notifyRedeemedInvite(entity: Invite) {
    try {
      notificationManager.sendNotification(NotificationType.INVITE_REDEEMED, {
        invite: entity,
        subject: `Invite Redeemed: ${entity.icode}`,
        message: `Your invite has been redeemed by ${entity.redeemedBy[entity.redeemedBy.length - 1].displayName}.`,
        notifySystem: false,
        notifyAdmin: false,
        notifyUser: entity.createdBy,
        actionUrl: '/invites',
        actionUrlTitle: 'View Invites',
      });
    } catch (e) {
      logger.error('Failed to send invite redeemed notification', {
        label: 'Notifications',
        errorMessage: e.message,
        invitedById: entity.createdBy?.id,
        icode: entity.icode,
      });
    }
  }

  private async notifyExpiredInvite(entity: Invite) {
    try {
      notificationManager.sendNotification(NotificationType.INVITE_EXPIRED, {
        invite: entity,
        subject: `Invite Expired: ${entity.icode}`,
        message: '',
        notifySystem: false,
        notifyAdmin: false,
        notifyUser: entity.createdBy,
        actionUrl: '/invites',
        actionUrlTitle: 'View Invites',
      });
    } catch (e) {
      logger.error('Failed to send invite expired notification', {
        label: 'Notifications',
        errorMessage: e.message,
        invitedById: entity.createdBy?.id,
        icode: entity.icode,
      });
    }
  }

  private async notifyNewInvite(entity: Invite) {
    const userRepository = getRepository(User);

    const admins = await userRepository.find({
      where: {
        permissions: In([Permission.MANAGE_INVITES, Permission.ADMIN]),
        id: Not(entity.createdBy?.id),
      },
      relations: ['settings'],
    });

    const adminsToNotify = admins.filter((user: User) => {
      const settings = user.settings;
      return (
        !settings ||
        settings.hasNotificationType(
          NotificationAgentKey.IN_APP,
          NotificationType.NEW_INVITE
        ) ||
        settings.hasNotificationType(
          NotificationAgentKey.EMAIL,
          NotificationType.NEW_INVITE
        ) ||
        settings.hasNotificationType(
          NotificationAgentKey.WEBPUSH,
          NotificationType.NEW_INVITE
        )
      );
    });

    await Promise.all(
      adminsToNotify.map(async (user: User) => {
        try {
          notificationManager.sendNotification(NotificationType.NEW_INVITE, {
            invite: entity,
            subject: `New Invite: ${entity.icode}`,
            message: `A new invite has been created by ${entity.createdBy?.displayName}.`,
            notifySystem: false,
            notifyAdmin: true,
            notifyUser: user,
            actionUrl: '/invites',
            actionUrlTitle: 'View Invites',
          });
        } catch (e) {
          logger.error('Failed to send new invite notification', {
            label: 'Notifications',
            errorMessage: e.message,
            invitedById: entity.createdBy?.id,
            icode: entity.icode,
          });
        }
      })
    );
  }

  public afterInsert(event: InsertEvent<Invite>): void {
    if (!event.entity) {
      return;
    }

    this.notifyNewInvite(event.entity);
  }

  public afterUpdate(event: UpdateEvent<Invite>): void {
    if (!event.entity) {
      return;
    }
    if (
      !event.entity.createdBy.hasPermission(
        [Permission.CREATE_INVITES, Permission.STREAMARR],
        { type: 'or' }
      )
    ) {
      return;
    }

    const previousUses = event.databaseEntity?.uses ?? 0;
    const currentUses = event.entity.uses ?? 0;
    const usesIncreased = currentUses > previousUses;

    if (
      usesIncreased ||
      (event.entity.status === InviteStatus.REDEEMED &&
        event.databaseEntity?.status !== InviteStatus.REDEEMED)
    ) {
      this.notifyRedeemedInvite(event.entity as Invite);
    }

    if (
      event.entity.status === InviteStatus.EXPIRED &&
      event.databaseEntity?.status !== InviteStatus.EXPIRED
    ) {
      this.notifyExpiredInvite(event.entity as Invite);
    }
  }
}
