import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type {
  Permission,
  PermissionCheckOptions,
} from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';

const expiredUserAllowedPaths: RegExp[] = [
  /^\/api\/v1$/,
  /^\/api\/v1\/status$/,
  /^\/api\/v1\/settings\/public$/,
  /^\/api\/v1\/backdrops$/,
  /^\/api\/v1\/libraries$/,
  /^\/api\/v1\/auth\/me$/,
  /^\/api\/v1\/auth\/logout$/,
  /^\/api\/v1\/auth\/reset-password(?:\/[^/]+)?$/,
];

const expiredUserOwnPaths: RegExp[] = [
  /^\/api\/v1\/user\/(\d+)$/,
  /^\/api\/v1\/user\/(\d+)\/quota$/,
  /^\/api\/v1\/user\/(\d+)\/notifications(?:\/[^/]+)?$/,
  /^\/api\/v1\/user\/(\d+)\/requests$/,
  /^\/api\/v1\/user\/(\d+)\/watched$/,
  /^\/api\/v1\/user\/(\d+)\/plex\/libraries$/,
  /^\/api\/v1\/user\/(\d+)\/pushSubscriptions$/,
  /^\/api\/v1\/user\/(\d+)\/pushSubscription\/[^/]+$/,
  /^\/api\/v1\/user\/(\d+)\/settings\/main$/,
  /^\/api\/v1\/user\/(\d+)\/settings\/notifications$/,
  /^\/api\/v1\/user\/(\d+)\/settings\/password$/,
  /^\/api\/v1\/user\/(\d+)\/settings\/seerr\/quota$/,
  /^\/api\/v1\/user\/(\d+)\/settings\/extension$/,
];

const isExpiredUserAllowedPath = (path: string, userId: number): boolean => {
  if (expiredUserAllowedPaths.some((pattern) => pattern.test(path))) {
    return true;
  }

  return expiredUserOwnPaths.some((pattern) => {
    const match = path.match(pattern);
    return match ? Number(match[1]) === userId : false;
  });
};

export const checkUser = async (req, _res, next) => {
  const settings = getSettings();
  let user: User | undefined | null;

  if (req.header('X-API-Key') === settings.main.apiKey) {
    const userRepository = getRepository(User);

    let userId = 1; // Work on original administrator account

    // If a User ID is provided, we will act on that user's behalf
    if (req.header('X-API-User')) {
      userId = Number(req.header('X-API-User'));
    }

    user = await userRepository.findOne({ where: { id: userId } });
  } else if (req.session?.userId) {
    const userRepository = getRepository(User);

    user = await userRepository.findOne({ where: { id: req.session.userId } });
  }

  if (user) {
    req.user = user;
  }

  req.locale = user?.settings?.locale
    ? user.settings.locale
    : settings.main.locale;

  if (
    user &&
    !user.active &&
    req.header('X-API-Key') !== getSettings().main.apiKey &&
    user.id !== 1 &&
    !isExpiredUserAllowedPath(req.originalUrl.split('?')[0], user.id)
  ) {
    return _res.status(403).json({
      message:
        'Your account access has expired. Contact an administrator to reactivate your account.',
    });
  }

  next();
};

export const isAuthenticated = (
  permissions?: Permission | Permission[],
  options?: PermissionCheckOptions
) => {
  const authMiddleware = (req, res, next) => {
    if (!req.user || !req.user.hasPermission(permissions ?? 0, options)) {
      res.status(403).json({
        status: 403,
        error: 'You do not have permission to access this endpoint',
      });
    } else {
      next();
    }
  };
  return authMiddleware;
};
