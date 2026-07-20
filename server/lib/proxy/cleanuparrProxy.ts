import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { Permission } from '@server/lib/permissions';
import type { UpgradeDispatcher } from '@server/lib/websocket/upgradeDispatcher';
import logger from '@server/logger';
import type { Request, RequestHandler, Response } from 'express';
import type { IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Socket } from 'net';

interface SessionRequest extends IncomingMessage {
  session?: { userId?: number };
}

export interface CleanuparrProxyConfig {
  name: string;
  hostname: string;
  port: number;
  useSsl: boolean;
  baseUrl: string;
  apiKey: string;
}

function getTarget(config: CleanuparrProxyConfig): string {
  const protocol = config.useSsl ? 'https' : 'http';
  return `${protocol}://${config.hostname}:${config.port}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  const withSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return withSlash.replace(/\/$/, '');
}

export function createCleanuparrProxy(config: CleanuparrProxyConfig) {
  const { name, apiKey } = config;
  const pathPrefix = normalizeBaseUrl(config.baseUrl);

  return createProxyMiddleware({
    target: getTarget(config),
    changeOrigin: true,
    autoRewrite: true,
    ws: false,
    pathRewrite: (path) =>
      path.startsWith(pathPrefix) ? path : `${pathPrefix}${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;
        proxyReq.setHeader('X-Api-Key', apiKey);

        const clientIp =
          expressReq.ip || req.socket?.remoteAddress || 'unknown';
        proxyReq.setHeader('X-Real-IP', clientIp);
        proxyReq.setHeader('X-Forwarded-For', clientIp);

        const forwardedProto =
          expressReq.get('X-Forwarded-Proto') || expressReq.protocol || 'http';
        const forwardedHost =
          expressReq.get('X-Forwarded-Host') || expressReq.get('Host') || '';
        const forwardedPort =
          expressReq.get('X-Forwarded-Port') ||
          (forwardedProto === 'https' ? '443' : '80');

        proxyReq.setHeader('X-Forwarded-Proto', forwardedProto);
        proxyReq.setHeader('X-Forwarded-Host', forwardedHost);
        proxyReq.setHeader('X-Forwarded-Port', forwardedPort);
        proxyReq.setHeader('X-Forwarded-Prefix', pathPrefix);
      },
      proxyReqWs: (proxyReq) => {
        proxyReq.setHeader('X-Api-Key', apiKey);
        proxyReq.setHeader('X-Forwarded-Prefix', pathPrefix);
      },
      proxyRes: (proxyRes) => {
        const location = proxyRes.headers['location'];
        if (location && typeof location === 'string') {
          const target = getTarget(config);
          if (location.startsWith(target)) {
            proxyRes.headers['location'] = location.replace(target, '');
          }
        }
      },
      error: (err, req, res) => {
        const target = getTarget(config);
        const errorCode = (err as NodeJS.ErrnoException).code;

        logger.error(`${name} proxy error: ${err.message}`, {
          label: 'Proxy',
          path: req.url,
          target,
          errorCode,
        });

        if (res && 'headersSent' in res && !res.headersSent) {
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
}

export function registerCleanuparrWebSocketHandler(
  dispatcher: UpgradeDispatcher,
  sessionMiddleware: RequestHandler,
  proxy: ReturnType<typeof createProxyMiddleware>,
  urlBase: string
) {
  const base = normalizeBaseUrl(urlBase);
  dispatcher.register({
    name: `cleanuparr:${base}`,
    match: (url) => url === base || url.startsWith(`${base}/`),
    handle: (req: SessionRequest, socket, head) => {
      sessionMiddleware(req as unknown as Request, {} as Response, async () => {
        const userId = req.session?.userId;
        if (!userId) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        try {
          const user = await getRepository(User).findOne({
            where: { id: userId },
          });
          if (!user || !user.hasPermission(Permission.ADMIN)) {
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
            socket.destroy();
            return;
          }
        } catch {
          socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
          socket.destroy();
          return;
        }
        proxy.upgrade(req, socket as Socket, head);
      });
    },
  });
}
