import type { Server } from 'http';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import { checkUser, isAuthenticated } from '@server/middleware/auth';
import { getSettings } from '@server/lib/settings';
import { createPlexProxy } from '@server/lib/proxy/plexProxy';
import logger from '@server/logger';

/**
 * Returns the list of active proxy paths based on current settings.
 * Used by OpenAPI validator to ignore these paths.
 */
export function getActiveProxyPaths(): string[] {
  const settings = getSettings();
  const paths: string[] = [];

  if (settings.plex.ip) {
    paths.push('/web');
  }

  // DVR services (radarr/sonarr) - arrays with baseUrl
  const dvrServices = [...settings.radarr, ...settings.sonarr];
  for (const service of dvrServices) {
    if (service.hostname && service.baseUrl) {
      paths.push(service.baseUrl);
    }
  }

  // Single services with urlBase
  const singleServices = [
    settings.tautulli,
    settings.uptime,
    settings.downloads,
    settings.tdarr,
    settings.bazarr,
    settings.prowlarr,
    settings.lidarr,
    settings.overseerr,
  ];
  for (const service of singleServices) {
    if (service.hostname && service.urlBase) {
      paths.push(service.urlBase);
    }
  }

  return paths;
}

export function createServiceProxyRouter(
  httpServer: Server,
  sessionMiddleware: RequestHandler
): Router {
  const router = Router();
  const settings = getSettings();

  // Auth middleware chain for proxy routes
  const authMiddleware = [sessionMiddleware, checkUser, isAuthenticated()];

  // Helper to register a proxy route with auth middleware
  const registerProxy = (
    path: string,
    proxy: RequestHandler,
    label: string
  ): void => {
    router.use(path, ...authMiddleware, proxy);
    logger.info(`${label} proxy registered at ${path}`, { label: 'Proxy' });
  };

  if (settings.plex.ip) {
    registerProxy(
      '/web',
      createPlexProxy(httpServer, sessionMiddleware),
      'Plex'
    );
  }

  // Future services can be added here using registerProxy():
  // if (settings.sonarr[0]?.hostname) {
  //   registerProxy('/sonarr', createSonarrProxy(), 'Sonarr');
  // }

  return router;
}
