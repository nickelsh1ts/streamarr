import type { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';

export const isOwnProfile = (): Middleware => {
  return (req, res, next) => {
    if (req.user?.id !== Number(req.params.id)) {
      return next({
        status: 403,
        message: "You do not have permission to view this user's settings.",
      });
    }
    next();
  };
};

export const isOwnProfileOrAdmin = (): Middleware => {
  const authMiddleware = (req, res, next) => {
    if (
      !req.user?.hasPermission(Permission.MANAGE_USERS) &&
      req.user?.id !== Number(req.params.id)
    ) {
      return next({
        status: 403,
        message: "You do not have permission to view this user's settings.",
      });
    }

    next();
  };
  return authMiddleware;
};

// Only the owner may manage the owner, and only the owner may manage other admins
export const canManageUserCredentials = (
  actor: User | undefined,
  target: User
): boolean =>
  !(
    (target.id === 1 && actor?.id !== 1) ||
    (target.hasPermission(Permission.ADMIN) &&
      target.id !== actor?.id &&
      actor?.id !== 1)
  );
