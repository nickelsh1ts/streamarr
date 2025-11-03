export enum Permission {
  NONE = 0,
  ADMIN = 2,
  MANAGE_USERS = 8,
  MANAGE_INVITES = 16,
  STREAMARR = 32,
  VOTE = 64,
  REQUEST = 256,
  VIEW_SCHEDULE = 512,
  MANAGE_EVENTS = 1024,
  CREATE_EVENTS = 8192,
  ADVANCED_INVITES = 2097152,
  VIEW_INVITES = 8388608,
  CREATE_INVITES = 33554432,
  CREATE_NOTIFICATIONS = 67108864,
  MANAGE_NOTIFICATIONS = 134217728,
  VIEW_NOTIFICATIONS = 268435456,
}

export interface PermissionCheckOptions {
  type: 'and' | 'or';
}

/**
 * Takes a Permission and the users permission value and determines
 * if the user has access to the permission provided. If the user has
 * the admin permission, true will always be returned from this check!
 *
 * @param permissions Single permission or array of permissions
 * @param value users current permission value
 * @param options Extra options to control permission check behavior (mainly for arrays)
 */
export const hasPermission = (
  permissions: Permission | Permission[],
  value: number,
  options: PermissionCheckOptions = { type: 'and' }
): boolean => {
  let total = 0;

  // If we are not checking any permissions, bail out and return true
  if (permissions === 0) {
    return true;
  }

  if (Array.isArray(permissions)) {
    if (value & Permission.ADMIN) {
      return true;
    }
    switch (options.type) {
      case 'and':
        return permissions.every((permission) => !!(value & permission));
      case 'or':
        return permissions.some((permission) => !!(value & permission));
    }
  } else {
    total = permissions;
  }

  return !!(value & Permission.ADMIN) || !!(value & total);
};
