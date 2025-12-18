import NotificationType from '@app/components/Common/NotificationTypeSelector/NotificationType';
import { NotificationType as Notification } from '@server/constants/notification';
import type { User } from '@app/hooks/useUser';
import { Permission, useUser } from '@app/hooks/useUser';
import { sortBy } from 'lodash';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export const hasNotificationType = (
  types: Notification | Notification[],
  value: number
): boolean => {
  let total = 0;

  // If we are not checking any notifications, bail out and return true
  if (types === 0) {
    return true;
  }

  if (Array.isArray(types)) {
    // Combine all notification values into one
    total = types.reduce((a, v) => a + v, 0);
  } else {
    total = types;
  }

  // Test notifications don't need to be enabled
  if (!(value & Notification.TEST_NOTIFICATION)) {
    value += Notification.TEST_NOTIFICATION;
  }

  return !!(value & total);
};

export const ALL_NOTIFICATIONS = Object.values(Notification)
  .filter((v) => !isNaN(Number(v)))
  .reduce((a, v) => a + Number(v), 0);

export interface NotificationItem {
  id: string;
  name: string;
  description: string;
  value: Notification;
  hasNotifyUser: boolean;
  children?: NotificationItem[];
  hidden?: boolean;
}

interface NotificationTypeSelectorProps {
  user?: User;
  enabledTypes?: number;
  currentTypes: number;
  onUpdate: (newTypes: number) => void;
  error?: string;
  agent?: string;
}

const NotificationTypeSelector = ({
  user,
  enabledTypes = ALL_NOTIFICATIONS,
  currentTypes,
  onUpdate,
  error,
  agent = '',
}: NotificationTypeSelectorProps) => {
  const { hasPermission } = useUser({ id: user?.id });
  const intl = useIntl();

  const availableTypes = useMemo(() => {
    const types: NotificationItem[] = [
      {
        id: 'invite-used-successfully',
        name: intl.formatMessage({
          id: 'notification.inviteUsedSuccessfully',
          defaultMessage: 'Invite Redeemed Successfully',
        }),
        description: intl.formatMessage({
          id: 'notification.inviteUsedSuccessfully.description',
          defaultMessage:
            'Get notified when an invite you sent has been successfully redeemed',
        }),
        value: Notification.INVITE_REDEEMED,
        hidden:
          !user ||
          !hasPermission([Permission.CREATE_INVITES, Permission.STREAMARR], {
            type: 'or',
          }),
        hasNotifyUser: true,
      },
      {
        id: 'invite-expired',
        name: intl.formatMessage({
          id: 'notification.inviteExpired',
          defaultMessage: 'Invite Expired',
        }),
        description: intl.formatMessage({
          id: 'notification.inviteExpired.description',
          defaultMessage: 'Get notified when an invite you created has expired',
        }),
        value: Notification.INVITE_EXPIRED,
        hidden:
          !user ||
          !hasPermission([Permission.CREATE_INVITES, Permission.STREAMARR], {
            type: 'or',
          }),
        hasNotifyUser: true,
      },
      // {
      //   id: 'friend-watching',
      //   name: intl.formatMessage({
      //     id: 'notification.friendWatching',
      //     defaultMessage: 'Friend Watching',
      //   }),
      //   description: intl.formatMessage({
      //     id: 'notification.friendWatching.description',
      //     defaultMessage: 'Get notified when a friend is watching a show',
      //   }),
      //   value: Notification.FRIEND_WATCHING,
      //   hidden: !user || !hasPermission(Permission.STREAMARR),
      //   hasNotifyUser: true,
      // },
      {
        id: 'local-messages',
        name: intl.formatMessage({
          id: 'notification.localMessages',
          defaultMessage: 'Streamarr Messages',
        }),
        description: intl.formatMessage({
          id: 'notification.localMessages.description',
          defaultMessage:
            'Get notified when you receive a message from Streamarr',
        }),
        value: Notification.LOCAL_MESSAGE,
        hidden: !user,
        hasNotifyUser: true,
      },
      {
        id: 'new-event',
        name: intl.formatMessage({
          id: 'notification.newEvent',
          defaultMessage: 'New Event',
        }),
        description: intl.formatMessage({
          id: 'notification.newEvent.description',
          defaultMessage: 'Get notified when a new Streamarr event is created',
        }),
        value: Notification.NEW_EVENT,
        hidden:
          !user ||
          !hasPermission([Permission.STREAMARR, Permission.VIEW_SCHEDULE], {
            type: 'or',
          }),
        hasNotifyUser: true,
      },
      {
        id: 'new-invite',
        name: intl.formatMessage({
          id: 'notification.newInvite',
          defaultMessage: 'New Invite Created',
        }),
        description: intl.formatMessage({
          id: 'notification.newInvite.description',
          defaultMessage: 'Get notified when a new invite is created',
        }),
        value: Notification.NEW_INVITE,
        hidden:
          !user ||
          !hasPermission([Permission.MANAGE_USERS, Permission.MANAGE_INVITES], {
            type: 'or',
          }),
        hasNotifyUser: true,
      },
      // {
      //   id: 'system',
      //   name: intl.formatMessage({
      //     id: 'notification.system',
      //     defaultMessage: 'System Notifications',
      //   }),
      //   description: intl.formatMessage({
      //     id: 'notification.system.description',
      //     defaultMessage: 'Get notified about important system events',
      //   }),
      //   value: Notification.SYSTEM,
      //   hidden: !user || !hasPermission(Permission.ADMIN),
      //   hasNotifyUser: true,
      // },
      // {
      //   id: 'updates',
      //   name: intl.formatMessage({
      //     id: 'notification.updates',
      //     defaultMessage: 'Updates',
      //   }),
      //   description: intl.formatMessage({
      //     id: 'notification.updates.description',
      //     defaultMessage: 'Get notified about Streamarr updates',
      //   }),
      //   value: Notification.UPDATES,
      //   hidden: !user || !hasPermission(Permission.ADMIN),
      //   hasNotifyUser: true,
      // },
      {
        id: 'user-created',
        name: intl.formatMessage({
          id: 'notification.userCreated',
          defaultMessage: 'User Created',
        }),
        description: intl.formatMessage({
          id: 'notification.userCreated.description',
          defaultMessage: 'Get notified when a new user is created',
        }),
        value: Notification.USER_CREATED,
        hidden: !user || !hasPermission(Permission.ADMIN),
        hasNotifyUser: true,
      },
    ];

    const filteredTypes = types.filter(
      (type) => !type.hidden && hasNotificationType(type.value, enabledTypes)
    );

    return user
      ? sortBy(filteredTypes, 'hasNotifyUser', 'DESC')
      : filteredTypes;
  }, [intl, user, hasPermission, enabledTypes]);

  if (!availableTypes.length) {
    return null;
  }

  return (
    <div role="group" aria-labelledby="group-label" className="form-group">
      <div className="mt-5 max-w-6xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
          <span id="group-label" className="group-label">
            <FormattedMessage
              id="common.notificationTypes"
              defaultMessage="Notification Types"
            />
            {!user && <span className="text-error ml-2">*</span>}
          </span>
          <div className="form-input-area">
            <div className="max-w-lg">
              {availableTypes.map((type) => (
                <NotificationType
                  key={`notification-type-${agent}-${type.id}`}
                  option={type}
                  currentTypes={currentTypes}
                  onUpdate={onUpdate}
                  agent={agent}
                />
              ))}
            </div>
            {error && <div className="text-error">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTypeSelector;
