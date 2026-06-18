import { Permission } from '@server/lib/permissions';
import { createArrProxy } from '@server/lib/proxy/arrProxy';
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
    settings.bazarr,
  ];
  for (const service of singleArrServices) {
    if (service.hostname && service.urlBase) {
      paths.push(service.urlBase);
    }
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
    requireAdmin = false
  ): void => {
    router.use(
      path,
      ...(requireAdmin ? adminMiddleware : authMiddleware),
      proxy
    );
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
