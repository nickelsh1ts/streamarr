import {
  NotificationSeverity,
  NotificationType,
} from '@server/constants/notification';
import { getRepository } from '@server/datasource';
import Event from '@server/entity/Event';
import { User } from '@server/entity/User';
import { userAcceptsNotificationType } from '@server/lib/notifications';
import { sendGroupNotification } from '@server/lib/notifications/dispatch';
import { Permission } from '@server/lib/permissions';
import moment from '@server/utils/momentWithLocale';
import type {
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { EventSubscriber } from 'typeorm';

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

    const eligibleUsers = users.filter(
      (user) =>
        userAcceptsNotificationType(user, type) &&
        user.hasPermission([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
          type: 'or',
        })
    );

    await sendGroupNotification(type, eligibleUsers, (intl) => ({
      event: entity,
      subject: intl.formatMessage(
        {
          id: 'notifications.calendar.subject',
          defaultMessage: 'Event: {summary} ({status})',
        },
        { summary: entity.summary, status: entity.status }
      ),
      message: intl.formatMessage(
        {
          id: 'notifications.calendar.message',
          defaultMessage: '{start} to {end}',
        },
        {
          start: moment(entity.start)
            .locale(intl.locale)
            .format('MMM D, h:mm A'),
          end: moment(entity.end).locale(intl.locale).format('MMM D, h:mm A'),
        }
      ),
      actionUrl: '/schedule',
      actionUrlTitle: 'View Events',
      severity:
        entity.status === 'CANCELLED'
          ? NotificationSeverity.WARNING
          : entity.status === 'TENTATIVE'
            ? NotificationSeverity.INFO
            : NotificationSeverity.PRIMARY,
    }));
  }

  public async afterInsert(event: InsertEvent<Event>): Promise<void> {
    if (!event.entity) {
      return;
    }

    await this.sendCalEventNotification(
      event.entity,
      NotificationType.NEW_EVENT
    );
  }

  public async afterUpdate(event: UpdateEvent<Event>): Promise<void> {
    if (!event.entity) {
      return;
    }

    await this.sendCalEventNotification(
      event.entity as Event,
      NotificationType.NEW_EVENT
    );
  }
}
