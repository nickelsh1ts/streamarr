import type { Server } from 'http';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { createPlexProxy } from '@server/lib/proxy/plexProxy';
import { createArrProxy } from '@server/lib/proxy/arrProxy';
import {
  createTdarrProxy,
  createTdarrStaticProxy,
  registerTdarrWebSocketHandler,
  TDARR_PROXY_PATH,
  TDARR_STATIC_PATH,
} from '@server/lib/proxy/tdarrProxy';
import logger from '@server/logger';

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

  return paths;
}

/**
 * Creates the service proxy router with session-protected proxy routes.
 */
export function createServiceProxyRouter(
  httpServer: Server,
  sessionMiddleware: RequestHandler
): Router {
  const router = Router();
  const settings = getSettings();

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
    logger.info(`${label} proxy registered at ${path}`, { label: 'Proxy' });
  };

  if (settings.plex.ip) {
    registerProxy(
      '/web',
      createPlexProxy(httpServer, sessionMiddleware),
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

  // Register single-instance *Arr services (requires ADMIN)
  const singleArrServices = [
    { service: settings.lidarr, name: 'Lidarr' },
    { service: settings.prowlarr, name: 'Prowlarr' },
    { service: settings.bazarr, name: 'Bazarr', apiKeyHeader: 'X-API-KEY' },
  ];

  for (const { service, name, apiKeyHeader } of singleArrServices) {
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
          apiKeyHeader,
        }),
        name,
        true
      );
    }
  }

  // Register Tdarr proxy (requires ADMIN, hardcoded paths)
  if (settings.tdarr.enabled && settings.tdarr.hostname) {
    const tdarrConfig = {
      hostname: settings.tdarr.hostname,
      port: settings.tdarr.port ?? 8265,
      useSsl: settings.tdarr.useSsl ?? false,
    };

    const tdarrProxy = createTdarrProxy(tdarrConfig);
    registerProxy(TDARR_PROXY_PATH, tdarrProxy, 'Tdarr', true);
    registerTdarrWebSocketHandler(httpServer, sessionMiddleware, tdarrProxy);

    // Static assets (no auth - loaded as resources after authenticated page loads)
    router.use(TDARR_STATIC_PATH, createTdarrStaticProxy(tdarrConfig));
    logger.info(`Tdarr Static proxy registered at ${TDARR_STATIC_PATH}`, {
      label: 'Proxy',
    });
  }

  return router;
}
