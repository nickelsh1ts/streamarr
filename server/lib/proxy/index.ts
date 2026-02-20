import type { IncomingMessage, Server } from 'http';
import type { Socket } from 'net';
import type { Request, RequestHandler, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '@server/logger';

// Extended request type for session data
interface SessionRequest extends IncomingMessage {
  session?: { userId?: number };
}

export interface ServiceProxyConfig {
  name: string;
  getTarget: () => string;
  pathPrefix?: string;
  webSocket?: boolean;
  wsPath?: string;
}

export function createServiceProxy(config: ServiceProxyConfig) {
  const { name, getTarget, pathPrefix, webSocket = false } = config;

  const proxy = createProxyMiddleware({
    target: getTarget(),
    changeOrigin: true,
    ws: webSocket,
    router: () => getTarget(),
    pathRewrite: pathPrefix ? (path) => `${pathPrefix}${path}` : undefined,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;
        const clientIp =
          expressReq.ip || req.socket?.remoteAddress || 'unknown';
        proxyReq.setHeader('X-Real-IP', clientIp);
        proxyReq.setHeader('X-Forwarded-For', clientIp);
        proxyReq.setHeader('X-Forwarded-Proto', expressReq.protocol || 'http');
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

        logger.error(`${name} proxy error: ${err.message}`, {
          label: 'Proxy',
          path: req.url,
          target,
          errorCode,
        });

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
  httpServer: Server,
  sessionMiddleware: RequestHandler,
  wsPath: string,
  proxy: ReturnType<typeof createProxyMiddleware>
) {
  httpServer.on('upgrade', (req: SessionRequest, socket, head) => {
    if (req.url?.startsWith(wsPath)) {
      sessionMiddleware(req as unknown as Request, {} as Response, () => {
        if (!req.session?.userId) {
          logger.warn('Unauthenticated WebSocket upgrade attempt', {
            label: 'Proxy',
            path: req.url,
          });
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        proxy.upgrade(req, socket as Socket, head);
      });
    }
  });
}
