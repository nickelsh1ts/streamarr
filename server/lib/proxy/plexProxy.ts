import type { RequestHandler } from 'express';
import { getSettings } from '@server/lib/settings';
import { getPlexHealth } from '@server/lib/plexHealthCheck';
import type { UpgradeDispatcher } from '@server/lib/websocket/upgradeDispatcher';
import { createServiceProxy, registerWebSocketHandler } from './index';

function getPlexTarget(): string {
  const { plex } = getSettings();
  const protocol = plex.useSsl ? 'https' : 'http';
  return `${protocol}://${plex.ip}:${plex.port}`;
}

export function createPlexProxy(
  dispatcher: UpgradeDispatcher,
  sessionMiddleware: RequestHandler
) {
  const proxy = createServiceProxy({
    name: 'Plex',
    getTarget: getPlexTarget,
    pathPrefix: '/web',
    webSocket: true,
    wsPath: '/web',
    suppressErrors: () => getPlexHealth().status !== 'healthy',
  });

  registerWebSocketHandler(dispatcher, sessionMiddleware, '/web', proxy);

  return proxy;
}
