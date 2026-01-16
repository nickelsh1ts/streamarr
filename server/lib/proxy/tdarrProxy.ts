import type { Server, IncomingMessage } from 'http';
import type { Socket } from 'net';
import type { Request, RequestHandler, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '@server/logger';

/** Hardcoded proxy paths for Tdarr (no custom base URL support) */
export const TDARR_PROXY_PATH = '/tdarr';
export const TDARR_STATIC_PATH = '/static';

interface SessionRequest extends IncomingMessage {
  session?: { userId?: number };
}

export interface TdarrProxyConfig {
  hostname: string;
  port: number;
  useSsl: boolean;
}

function getTarget(config: TdarrProxyConfig): string {
  const protocol = config.useSsl ? 'https' : 'http';
  return `${protocol}://${config.hostname}:${config.port}`;
}

/**
 * Creates the main Tdarr UI proxy.
 * Strips /tdarr prefix and forwards to Tdarr root.
 * WebSocket support enabled for Socket.IO real-time updates.
 */
export function createTdarrProxy(config: TdarrProxyConfig) {
  return createProxyMiddleware({
    target: getTarget(config),
    changeOrigin: true,
    ws: true,
    router: () => getTarget(config),
    pathFilter: (path) => !path.includes('/_next/'),
    pathRewrite: (path) => path.replace(/^\/tdarr/, '') || '/',
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
        if (location && typeof location === 'string') {
          const target = getTarget(config);
          if (location.startsWith(target)) {
            proxyRes.headers['location'] = location.replace(
              target,
              TDARR_PROXY_PATH
            );
          }
        }
      },
      error: (err, req, res) => {
        logger.error(`Tdarr proxy error: ${err.message}`, {
          label: 'Proxy',
          path: req.url,
        });
        if (res && 'headersSent' in res && !res.headersSent) {
          (res as Response).status(502).json({
            status: 502,
            error: 'Service unavailable',
            message: 'Unable to connect to Tdarr',
          });
        }
      },
    },
  });
}

/**
 * Creates a proxy for Tdarr static assets (CSS, JS, fonts).
 * Express strips the /static prefix when mounting, so we prepend it back.
 */
export function createTdarrStaticProxy(config: TdarrProxyConfig) {
  return createProxyMiddleware({
    target: getTarget(config),
    changeOrigin: true,
    router: () => getTarget(config),
    pathRewrite: (path) => `/static${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;
        const clientIp =
          expressReq.ip || req.socket?.remoteAddress || 'unknown';
        proxyReq.setHeader('X-Real-IP', clientIp);
        proxyReq.setHeader('X-Forwarded-For', clientIp);
      },
      error: (err, req, res) => {
        logger.error(`Tdarr static proxy error: ${err.message}`, {
          label: 'Proxy',
          path: req.url,
        });
        if (res && 'headersSent' in res && !res.headersSent) {
          (res as Response).status(502).json({
            status: 502,
            error: 'Service unavailable',
            message: 'Unable to connect to Tdarr',
          });
        }
      },
    },
  });
}

/**
 * Registers WebSocket handler for Tdarr Socket.IO connections.
 */
export function registerTdarrWebSocketHandler(
  httpServer: Server,
  sessionMiddleware: RequestHandler,
  proxy: ReturnType<typeof createProxyMiddleware>
) {
  httpServer.on('upgrade', (req: SessionRequest, socket, head) => {
    if (req.url?.startsWith(`${TDARR_PROXY_PATH}/socket.io`)) {
      sessionMiddleware(req as unknown as Request, {} as Response, () => {
        if (!req.session?.userId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        proxy.upgrade(req, socket as Socket, head);
      });
    }
  });
}
