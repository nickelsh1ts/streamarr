import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import notificationManager, {
  hasNotificationType,
} from '@server/lib/notifications';
import { EventSubscriber } from 'typeorm';
import Event from '@server/entity/Event';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import logger from '@server/logger';
import moment from 'moment';
import { Permission } from '@server/lib/permissions';

@EventSubscriber()
export class CalEventSubscriber implements EntitySubscriberInterface<Event> {
  public listenTo(): typeof Event {
    return Event;
  }

  private async sendCalEventNotification(
    entity: Event,
    type: NotificationType
  ) {
    if (!entity.sendNotification || !moment(entity.start).isAfter(moment())) {
      return;
    }

    const userRepository = getRepository(User);

    const users = await userRepository.find({
      relations: ['settings'],
    });

    const eligibleUsers = users.filter((user) => {
      const settings = user.settings;
      return (
        (!settings ||
          hasNotificationType(type, settings.notificationTypes?.inApp ?? 0) ||
          hasNotificationType(type, settings.notificationTypes?.email ?? 0) ||
          hasNotificationType(
            type,
            settings.notificationTypes?.webpush ?? 0
          )) &&
        user.hasPermission([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
          type: 'or',
        })
      );
    });

    await Promise.all(
      eligibleUsers.map(async (user) => {
        try {
          const payload = {
            event: entity,
            subject: `Event: ${entity.summary} (${entity.status})`,
            message: `${moment(entity.start).format('MMM D, h:mm A')} to ${moment(entity.end).format('MMM D, h:mm A')}`,
            notifySystem: false,
            notifyAdmin: false,
            notifyUser: user,
            actionUrl: '/schedule',
            actionUrlTitle: 'View Events',
            severity:
              entity.status === 'CANCELLED'
                ? NotificationSeverity.WARNING
                : entity.status === 'TENTATIVE'
                  ? NotificationSeverity.INFO
                  : NotificationSeverity.PRIMARY,
          };

          notificationManager.sendNotification(type, payload);
        } catch (e) {
          logger.error('Failed to send calendar event notification', {
            label: 'Notifications',
            errorMessage: e.message,
            userId: user.id,
            eventSummary: entity.summary,
          });
        }
      })
    );
  }

  public afterInsert(event: InsertEvent<Event>): void {
    if (!event.entity) {
      return;
    }

    this.sendCalEventNotification(event.entity, NotificationType.NEW_EVENT);
  }

  public afterUpdate(event: UpdateEvent<Event>): void {
    if (!event.entity) {
      return;
    }

    this.sendCalEventNotification(
      event.entity as Event,
      NotificationType.NEW_EVENT
    );
  }
}
