import type { Server } from 'http';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import { createPlexProxy } from '@server/lib/proxy/plexProxy';
import { createArrProxy } from '@server/lib/proxy/arrProxy';
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

  for (const service of [...settings.radarr, ...settings.sonarr]) {
    if (service.hostname && service.baseUrl) {
      paths.push(service.baseUrl);
    }
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

  return router;
}
