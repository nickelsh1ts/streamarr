import { Permission } from '@server/lib/permissions';
import {
  createServiceProxy,
  registerWebSocketHandler,
} from '@server/lib/proxy';
import { createArrProxy } from '@server/lib/proxy/arrProxy';
import {
  createCleanuparrProxy,
  registerCleanuparrWebSocketHandler,
} from '@server/lib/proxy/cleanuparrProxy';
import { createPlexProxy } from '@server/lib/proxy/plexProxy';
import {
  createSeerrAssetProxy,
  createSeerrProxy,
  createSeerrRuntimeProxy,
} from '@server/lib/proxy/seerrProxy';
import { createTautulliProxy } from '@server/lib/proxy/tautulliProxy';
import {
  createTdarrProxy,
  createTdarrStaticProxy,
  registerTdarrWebSocketHandler,
  TDARR_PROXY_PATH,
  TDARR_STATIC_PATH,
} from '@server/lib/proxy/tdarrProxy';
import { getSettings } from '@server/lib/settings';
import {
  getShelfmarkAPI,
  linkShelfmarkAccount,
  ShelfmarkAccountCreationDisabledError,
  ShelfmarkAccountLinkRequiresManagerError,
} from '@server/lib/shelfmark';
import type { UpgradeDispatcher } from '@server/lib/websocket/upgradeDispatcher';
import logger from '@server/logger';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import type { RequestHandler } from 'express';
import { Router } from 'express';

/**
 * Returns active proxy paths for OpenAPI validator to ignore.
 */
export function getActiveProxyPaths(): string[] {
  const settings = getSettings();
  const paths: string[] = [];

  if (settings.plex.ip) {
    paths.push('/web');
  }

  // Multi-instance DVR services (radarr/sonarr)
  for (const service of [...settings.radarr, ...settings.sonarr]) {
    if (service.hostname && service.baseUrl) {
      paths.push(service.baseUrl);
    }
  }

  // Single-instance *Arr services
  const singleArrServices = [
    settings.lidarr,
    settings.prowlarr,
    settings.chaptarr,
    settings.bazarr,
  ];
  for (const service of singleArrServices) {
    if (service.hostname && service.urlBase) {
      paths.push(service.urlBase);
    }
  }

  // Cleanuparr (base-URL aware, SignalR)
  if (
    settings.cleanuparr.enabled &&
    settings.cleanuparr.hostname &&
    settings.cleanuparr.urlBase
  ) {
    paths.push(settings.cleanuparr.urlBase);
  }

  // Audiobookshelf (base-URL aware)
  if (
    settings.audiobookshelf.enabled &&
    settings.audiobookshelf.hostname &&
    settings.audiobookshelf.urlBase
  ) {
    paths.push(settings.audiobookshelf.urlBase);
  }

  if (
    settings.shelfmark.enabled &&
    settings.shelfmark.hostname &&
    settings.shelfmark.urlBase
  ) {
    paths.push(settings.shelfmark.urlBase);
  }

  // Tdarr (hardcoded paths - no custom base URL support)
  if (settings.tdarr.enabled && settings.tdarr.hostname) {
    paths.push(TDARR_PROXY_PATH);
    paths.push(TDARR_STATIC_PATH);
  }

  // Tautulli
  if (
    settings.tautulli.enabled &&
    settings.tautulli.hostname &&
    settings.tautulli.urlBase
  ) {
    paths.push(settings.tautulli.urlBase);
  }

  // Seerr (Overseerr) - no native base-URL support; proxied with on-the-fly
  // rewrite, so its path must be excluded from OpenAPI request validation.
  if (
    settings.overseerr.enabled &&
    settings.overseerr.hostname &&
    settings.overseerr.urlBase
  ) {
    paths.push(settings.overseerr.urlBase);
  }

  return paths;
}

/**
 * Creates the service proxy router with session-protected proxy routes.
 */
export function createServiceProxyRouter(
  dispatcher: UpgradeDispatcher,
  sessionMiddleware: RequestHandler
): Router {
  const router = Router();
  const settings = getSettings();
  const registeredRoutes: { name: string; path: string }[] = [];

  const authMiddleware = [sessionMiddleware, checkUser, isAuthenticated()];
  const adminMiddleware = [
    sessionMiddleware,
    checkUser,
    isAuthenticated(Permission.ADMIN),
  ];

  const registerProxy = (
    path: string,
    proxy: RequestHandler,
    label: string,
    requireAdmin = false,
    permissions?: Permission[],
    middleware: RequestHandler[] = []
  ): void => {
    const guard = permissions
      ? [
          sessionMiddleware,
          checkUser,
          isAuthenticated(permissions, { type: 'or' }),
        ]
      : requireAdmin
        ? adminMiddleware
        : authMiddleware;

    router.use(path, ...guard, ...middleware, proxy);
    registeredRoutes.push({ name: label, path });
  };

  if (settings.plex.ip) {
    registerProxy(
      '/web',
      createPlexProxy(dispatcher, sessionMiddleware),
      'Plex'
    );
  }

  const dvrServices = [
    ...settings.radarr.map((s) => ({ ...s, type: 'Radarr' as const })),
    ...settings.sonarr.map((s) => ({ ...s, type: 'Sonarr' as const })),
  ];

  for (const service of dvrServices) {
    if (service.hostname && service.baseUrl) {
      const label = `${service.type} (${service.name})`;
      registerProxy(
        service.baseUrl,
        createArrProxy({
          name: label,
          hostname: service.hostname,
          port: service.port,
          useSsl: service.useSsl,
          baseUrl: service.baseUrl,
          apiKey: service.apiKey,
        }),
        label,
        true
      );
    }
  }

  // Register single-instance *Arr services that support SSL (requires ADMIN)
  const singleArrServices = [
    { service: settings.lidarr, name: 'Lidarr' },
    { service: settings.prowlarr, name: 'Prowlarr' },
    { service: settings.chaptarr, name: 'Chaptarr' },
  ];

  for (const { service, name } of singleArrServices) {
    if (service.hostname && service.urlBase && service.apiKey) {
      registerProxy(
        service.urlBase,
        createArrProxy({
          name,
          hostname: service.hostname,
          port: service.port ?? 0,
          useSsl: service.useSsl ?? false,
          baseUrl: service.urlBase,
          apiKey: service.apiKey,
        }),
        name,
        true
      );
    }
  }

  // Register Bazarr separately (HTTP only - no SSL support)
  if (
    settings.bazarr.hostname &&
    settings.bazarr.urlBase &&
    settings.bazarr.apiKey
  ) {
    registerProxy(
      settings.bazarr.urlBase,
      createArrProxy({
        name: 'Bazarr',
        hostname: settings.bazarr.hostname,
        port: settings.bazarr.port ?? 6767,
        useSsl: false, // Bazarr doesn't support SSL
        baseUrl: settings.bazarr.urlBase,
        apiKey: settings.bazarr.apiKey,
        apiKeyHeader: 'X-API-KEY',
      }),
      'Bazarr',
      true
    );
  }

  // Register Cleanuparr proxy (requires ADMIN, base-URL aware, SignalR WS)
  if (
    settings.cleanuparr.enabled &&
    settings.cleanuparr.hostname &&
    settings.cleanuparr.urlBase &&
    settings.cleanuparr.apiKey
  ) {
    const cleanuparrProxy = createCleanuparrProxy({
      name: 'Cleanuparr',
      hostname: settings.cleanuparr.hostname,
      port: settings.cleanuparr.port ?? 11011,
      useSsl: settings.cleanuparr.useSsl ?? false,
      baseUrl: settings.cleanuparr.urlBase,
      apiKey: settings.cleanuparr.apiKey,
    });
    const cleanuparrBase = settings.cleanuparr.urlBase;
    router.get(cleanuparrBase, (req, res, next) => {
      const [pathOnly, query] = req.originalUrl.split('?');
      if (pathOnly === cleanuparrBase) {
        res.redirect(308, `${cleanuparrBase}/${query ? `?${query}` : ''}`);
        return;
      }
      next();
    });
    registerProxy(
      settings.cleanuparr.urlBase,
      cleanuparrProxy,
      'Cleanuparr',
      true
    );
    registerCleanuparrWebSocketHandler(
      dispatcher,
      sessionMiddleware,
      cleanuparrProxy,
      settings.cleanuparr.urlBase
    );
  }

  // Register Audiobookshelf proxy (requires LISTEN or READER, base-URL aware)
  if (
    settings.audiobookshelf.enabled &&
    settings.audiobookshelf.hostname &&
    settings.audiobookshelf.urlBase &&
    settings.audiobookshelf.apiKey
  ) {
    const audiobookshelfProxy = createServiceProxy({
      name: 'Audiobookshelf',
      getTarget: () => {
        const { audiobookshelf } = getSettings();
        const protocol = audiobookshelf.useSsl ? 'https' : 'http';
        return `${protocol}://${audiobookshelf.hostname}:${audiobookshelf.port}`;
      },
      pathPrefix: settings.audiobookshelf.urlBase,
      webSocket: false,
      suppressErrors: () => false,
    });

    registerProxy(
      settings.audiobookshelf.urlBase,
      audiobookshelfProxy,
      'Audiobookshelf',
      false,
      [Permission.LISTEN, Permission.READER]
    );
    registerWebSocketHandler(
      dispatcher,
      sessionMiddleware,
      settings.audiobookshelf.urlBase,
      audiobookshelfProxy
    );
  }

  if (
    settings.shelfmark.enabled &&
    settings.shelfmark.hostname &&
    settings.shelfmark.urlBase
  ) {
    const shelfmarkProxy = createServiceProxy({
      name: 'Shelfmark',
      getTarget: () => {
        const { shelfmark } = getSettings();
        const protocol = shelfmark.useSsl ? 'https' : 'http';
        return `${protocol}://${shelfmark.hostname}:${shelfmark.port}`;
      },
      pathPrefix: settings.shelfmark.urlBase,
      webSocket: false,
      suppressErrors: () => false,
      onProxyReq: (proxyReq, req) => {
        proxyReq.removeHeader('X-Auth-User');
        proxyReq.removeHeader('X-Auth-Groups');
        proxyReq.setHeader('X-Auth-User', req.user!.shelfmarkUsername!);
        proxyReq.setHeader(
          'X-Auth-Groups',
          req.user?.hasPermission(Permission.ADMIN) ? 'streamarr-admin' : ''
        );
      },
    });

    registerProxy(
      settings.shelfmark.urlBase,
      shelfmarkProxy,
      'Shelfmark',
      false,
      [Permission.BOOKMARK, Permission.READER],
      [
        async (req, res, next) => {
          try {
            const settings = getSettings().shelfmark;
            const user = req.user!;
            const existingAccount =
              user.shelfmarkUsername &&
              (await getShelfmarkAPI(settings).getAllUsers()).some(
                (candidate) =>
                  candidate.username.toLocaleLowerCase() ===
                  user.shelfmarkUsername?.toLocaleLowerCase()
              );
            if (existingAccount) {
              return next();
            }

            await linkShelfmarkAccount(user, {
              allowCreation: !!settings.enableNewUserSignIn,
              allowExistingAccountLink: user.hasPermission(
                Permission.MANAGE_USERS
              ),
            });
            return next();
          } catch (e) {
            if (
              e instanceof ShelfmarkAccountCreationDisabledError ||
              e instanceof ShelfmarkAccountLinkRequiresManagerError
            ) {
              return res.status(403).json({
                message:
                  'Your Shelfmark account must be linked by an administrator before you can access it.',
              });
            }
            logger.error('Failed to provision Shelfmark proxy account', {
              label: 'Shelfmark',
              message: e instanceof Error ? e.message : String(e),
              userId: req.user?.id,
            });
            return res.status(502).json({
              message: 'Failed to connect to Shelfmark.',
            });
          }
        },
      ]
    );
  }

  // Register Tdarr proxy (requires ADMIN, hardcoded paths)
  if (settings.tdarr.enabled && settings.tdarr.hostname) {
    const tdarrConfig = {
      hostname: settings.tdarr.hostname,
      port: settings.tdarr.port ?? 8265,
    };

    const tdarrProxy = createTdarrProxy(tdarrConfig);
    registerProxy(TDARR_PROXY_PATH, tdarrProxy, 'Tdarr', true);
    registerTdarrWebSocketHandler(dispatcher, sessionMiddleware, tdarrProxy);

    // Static assets (no auth - loaded as resources after authenticated page loads)
    router.use(TDARR_STATIC_PATH, createTdarrStaticProxy(tdarrConfig));
    registeredRoutes.push({ name: 'Tdarr Static', path: TDARR_STATIC_PATH });
  }

  // Register Tautulli proxy
  if (
    settings.tautulli.enabled &&
    settings.tautulli.hostname &&
    settings.tautulli.urlBase
  ) {
    registerProxy(
      settings.tautulli.urlBase,
      createTautulliProxy({
        hostname: settings.tautulli.hostname,
        port: settings.tautulli.port ?? 8181,
        useSsl: settings.tautulli.useSsl ?? false,
        urlBase: settings.tautulli.urlBase,
      }),
      'Tautulli',
      false
    );
  }

  // Register Seerr (Overseerr) proxy. Seerr has no base-URL support, so this
  // strips the prefix, rewrites the HTML shell (and injects a runtime shim +
  // theme CSS), and streams static assets untouched.
  if (
    settings.overseerr.enabled &&
    settings.overseerr.hostname &&
    settings.overseerr.urlBase
  ) {
    const seerrConfig = {
      hostname: settings.overseerr.hostname,
      port: settings.overseerr.port ?? 5055,
      useSsl: settings.overseerr.useSsl ?? false,
      base: settings.overseerr.urlBase,
      // Read live so theme changes apply without a restart.
      getTheme: () => getSettings().main.theme,
    };

    router.use(
      settings.overseerr.urlBase,
      sessionMiddleware,
      checkUser,
      isAuthenticated([Permission.REQUEST, Permission.STREAMARR], {
        type: 'or',
      }),
      createSeerrProxy(seerrConfig),
      createSeerrRuntimeProxy(seerrConfig),
      createSeerrAssetProxy(seerrConfig)
    );
    registeredRoutes.push({ name: 'Seerr', path: settings.overseerr.urlBase });
  }

  if (registeredRoutes.length > 0) {
    logger.info('Proxy routes registered successfully', {
      label: 'Proxy',
      services: registeredRoutes.map(({ name, path }) => `${name} at ${path}`),
    });
  }

  return router;
}
