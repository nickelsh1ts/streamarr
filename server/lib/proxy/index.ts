import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { UpgradeDispatcher } from '@server/lib/websocket/upgradeDispatcher';
import logger from '@server/logger';
import type { Request, RequestHandler, Response } from 'express';
import type { ClientRequest, IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Socket } from 'net';

// Extended request type for session data
interface SessionRequest extends IncomingMessage {
  session?: { userId?: number };
}

export interface ServiceProxyConfig {
  name: string;
  getTarget: () => string;
  pathPrefix?: string;
  webSocket?: boolean;
  suppressErrors?: () => boolean;
  onProxyReq?: (proxyReq: ClientRequest, req: Request) => void;
}

export function createServiceProxy(config: ServiceProxyConfig) {
  const {
    name,
    getTarget,
    pathPrefix,
    webSocket = false,
    suppressErrors,
    onProxyReq,
  } = config;

  const proxy = createProxyMiddleware({
    target: getTarget(),
    changeOrigin: true,
    ws: webSocket,
    router: () => getTarget(),
    pathRewrite: pathPrefix
      ? (path) => (path.startsWith(pathPrefix) ? path : `${pathPrefix}${path}`)
      : undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;
        const clientIp =
          expressReq.ip || req.socket?.remoteAddress || 'unknown';
        proxyReq.setHeader('X-Real-IP', clientIp);
        proxyReq.setHeader('X-Forwarded-For', clientIp);
        proxyReq.setHeader('X-Forwarded-Proto', expressReq.protocol || 'http');
        onProxyReq?.(proxyReq, expressReq);
      },
      proxyRes: (proxyRes) => {
        const location = proxyRes.headers['location'];
        if (location) {
          const target = getTarget();
          if (location.startsWith(target)) {
            proxyRes.headers['location'] = location.replace(target, '');
          }
        }
      },
      error: (err, req, res) => {
        const target = getTarget();
        const errorCode = (err as NodeJS.ErrnoException).code;

        if (!suppressErrors?.()) {
          logger.error(`${name} proxy error: ${err.message}`, {
            label: 'Proxy',
            path: req.url,
            target,
            errorCode,
          });
        }

        if (
          res &&
          'headersSent' in res &&
          !res.headersSent &&
          'status' in res
        ) {
          (res as Response).status(502).json({
            status: 502,
            error: 'Service unavailable',
            message: `Unable to connect to ${name}`,
            target,
            reason: err.message,
            code: errorCode,
          });
        }
      },
    },
  });

  return proxy;
}

export function registerWebSocketHandler(
  dispatcher: UpgradeDispatcher,
  sessionMiddleware: RequestHandler,
  wsPath: string,
  proxy: ReturnType<typeof createProxyMiddleware>,
  authorizeUser?: (user: User) => boolean | Promise<boolean>
) {
  dispatcher.register({
    name: `proxy:${wsPath}`,
    match: (url) => url.startsWith(wsPath),
    handle: (req: SessionRequest, socket, head) => {
      sessionMiddleware(req as unknown as Request, {} as Response, async () => {
        if (!req.session?.userId) {
          logger.warn('Unauthenticated WebSocket upgrade attempt', {
            label: 'Proxy',
            path: req.url,
          });
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        if (authorizeUser) {
          try {
            const user = await getRepository(User).findOne({
              where: { id: req.session.userId },
            });
            if (!user || !(await authorizeUser(user))) {
              socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
              socket.destroy();
              return;
            }
            (req as Request).user = user;
          } catch (e) {
            logger.error('WebSocket upgrade authorization failed', {
              label: 'Proxy',
              path: req.url,
              message: e instanceof Error ? e.message : String(e),
            });
            socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
            socket.destroy();
            return;
          }
        }
        proxy.upgrade(req, socket as Socket, head);
      });
    },
  });
}
