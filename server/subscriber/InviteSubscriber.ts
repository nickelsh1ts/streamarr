import { InviteStatus } from '@server/constants/invite';
import { NotificationType } from '@server/constants/notification';
import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import { User } from '@server/entity/User';
import { getIntl } from '@server/i18n';
import notificationManager, {
  userAcceptsNotificationType,
} from '@server/lib/notifications';
import { sendGroupNotification } from '@server/lib/notifications/dispatch';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';

@EventSubscriber()
export class InviteSubscriber implements EntitySubscriberInterface<Invite> {
  public listenTo(): typeof Invite {
    return Invite;
  }

  private async notifyRedeemedInvite(entity: Invite) {
    const intl = getIntl(entity.createdBy?.settings?.locale);
    try {
      await notificationManager.sendNotification(
        NotificationType.INVITE_REDEEMED,
        {
          invite: entity,
          subject: intl.formatMessage(
            {
              id: 'notifications.invite.redeemed.subject',
              defaultMessage: 'Invite Redeemed: {icode}',
            },
            { icode: entity.icode }
          ),
          message: intl.formatMessage(
            {
              id: 'notifications.invite.redeemed.message',
              defaultMessage: 'Your invite has been redeemed by {displayName}.',
            },
            { displayName: entity.redeemedBy.at(-1)?.displayName ?? '' }
          ),
          notifySystem: false,
          notifyAdmin: false,
          notifyUser: entity.createdBy,
          actionUrl: '/invites',
          actionUrlTitle: 'View Invites',
        }
      );
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
    const intl = getIntl(entity.createdBy?.settings?.locale);
    try {
      await notificationManager.sendNotification(
        NotificationType.INVITE_EXPIRED,
        {
          invite: entity,
          subject: intl.formatMessage(
            {
              id: 'notifications.invite.expired.subject',
              defaultMessage: 'Invite Expired: {icode}',
            },
            { icode: entity.icode }
          ),
          message: '',
          notifySystem: false,
          notifyAdmin: false,
          notifyUser: entity.createdBy,
          actionUrl: '/invites',
          actionUrlTitle: 'View Invites',
        }
      );
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

    const allUsers = await userRepository.find({
      relations: ['settings'],
    });

    const admins = allUsers.filter(
      (user) =>
        user.id !== entity.createdBy?.id &&
        user.hasPermission([Permission.MANAGE_INVITES, Permission.ADMIN], {
          type: 'or',
        })
    );

    const adminsToNotify = admins.filter((user) =>
      userAcceptsNotificationType(user, NotificationType.NEW_INVITE)
    );

    await sendGroupNotification(
      NotificationType.NEW_INVITE,
      adminsToNotify,
      (intl) => ({
        invite: entity,
        subject: intl.formatMessage(
          {
            id: 'notifications.invite.new.subject',
            defaultMessage: 'New Invite: {icode}',
          },
          { icode: entity.icode }
        ),
        message: intl.formatMessage(
          {
            id: 'notifications.invite.new.message',
            defaultMessage: 'A new invite has been created by {displayName}.',
          },
          { displayName: entity.createdBy?.displayName ?? '' }
        ),
        actionUrl: '/invites',
        actionUrlTitle: 'View Invites',
      })
    );
  }

  public async afterInsert(event: InsertEvent<Invite>): Promise<void> {
    if (!event.entity) {
      return;
    }

    await this.notifyNewInvite(event.entity);
  }

  public async afterUpdate(event: UpdateEvent<Invite>): Promise<void> {
    if (!event.entity) {
      return;
    }

    const previousUses = event.databaseEntity?.uses ?? 0;
    const currentUses = event.entity.uses ?? 0;
    if (currentUses > previousUses) {
      await this.notifyRedeemedInvite(event.entity as Invite);
    } else if (
      event.entity.status === InviteStatus.REDEEMED &&
      event.databaseEntity?.status !== InviteStatus.REDEEMED
    ) {
      await this.notifyRedeemedInvite(event.entity as Invite);
    }

    if (
      event.entity.status === InviteStatus.EXPIRED &&
      event.databaseEntity?.status !== InviteStatus.EXPIRED
    ) {
      await this.notifyExpiredInvite(event.entity as Invite);
    }
  }
}
