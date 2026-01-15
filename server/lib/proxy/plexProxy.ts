import type { Server } from 'http';
import type { RequestHandler } from 'express';
import { getSettings } from '@server/lib/settings';
import {
  createServiceProxy,
  registerWebSocketHandler,
} from './index';

function getPlexTarget(): string {
  const { plex } = getSettings();
  const protocol = plex.useSsl ? 'https' : 'http';
  return `${protocol}://${plex.ip}:${plex.port}`;
}

export function createPlexProxy(
  httpServer: Server,
  sessionMiddleware: RequestHandler
) {
  const proxy = createServiceProxy({
    name: 'Plex',
    getTarget: getPlexTarget,
    pathPrefix: '/web',
    webSocket: true,
    wsPath: '/web',
  });

  registerWebSocketHandler(httpServer, sessionMiddleware, '/web', proxy);

  return proxy;
}
