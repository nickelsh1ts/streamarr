import NotificationType from '@app/components/Common/NotificationTypeSelector/NotificationType';
import type { User } from '@app/hooks/useUser';
import { Permission, useUser } from '@app/hooks/useUser';
import { sortBy } from 'lodash';
import { useMemo, useState } from 'react';

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

export enum Notification {
  NONE = 0,
  MEDIA_PENDING = 2,
  MEDIA_APPROVED = 4,
  MEDIA_AVAILABLE = 8,
  MEDIA_FAILED = 16,
  TEST_NOTIFICATION = 32,
  MEDIA_DECLINED = 64,
  MEDIA_AUTO_APPROVED = 128,
  ISSUE_CREATED = 256,
  ISSUE_COMMENT = 512,
  ISSUE_RESOLVED = 1024,
  ISSUE_REOPENED = 2048,
  INVITE_REDEEMED = 4096,
}

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
}

const NotificationTypeSelector = ({
  user,
  enabledTypes = ALL_NOTIFICATIONS,
  currentTypes,
  onUpdate,
  error,
}: NotificationTypeSelectorProps) => {
  const { hasPermission } = useUser({ id: user?.id });
  const [allowedTypes, setAllowedTypes] = useState(enabledTypes);

  const availableTypes = useMemo(() => {
    const types: NotificationItem[] = [
      {
        id: 'invite-used-successfully',
        name: 'Invite Successfully Redeemed',
        description:
          'Get notified when an invite you sent has been successfully redeemed',
        value: Notification.INVITE_REDEEMED,
        hidden:
          !user ||
          !hasPermission([Permission.CREATE_INVITES, Permission.STREAMARR], {
            type: 'or',
          }),
        hasNotifyUser: true,
      },
    ];

    const filteredTypes = types.filter(
      (type) => !type.hidden && hasNotificationType(type.value, enabledTypes)
    );

    const newAllowedTypes = filteredTypes.reduce((a, v) => a + v.value, 0);
    if (newAllowedTypes !== allowedTypes) {
      setAllowedTypes(newAllowedTypes);
    }

    return user
      ? sortBy(filteredTypes, 'hasNotifyUser', 'DESC')
      : filteredTypes;
  }, [user, hasPermission, allowedTypes, enabledTypes]);

  if (!availableTypes.length) {
    return null;
  }

  return (
    <div role="group" aria-labelledby="group-label" className="form-group">
      <div className="mt-5 max-w-6xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
          <span id="group-label" className="group-label">
            Notification Types
            {!user && <span className="text-error ml-2">*</span>}
          </span>
          <div className="form-input-area">
            <div className="max-w-lg">
              {availableTypes.map((type) => (
                <NotificationType
                  key={`notification-type-${type.id}`}
                  option={type}
                  currentTypes={currentTypes}
                  onUpdate={onUpdate}
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
