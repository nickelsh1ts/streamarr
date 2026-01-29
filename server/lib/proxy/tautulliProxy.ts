import type { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '@server/logger';

export interface TautulliProxyConfig {
  hostname: string;
  port: number;
  useSsl: boolean;
  urlBase: string;
}

function getTarget(config: TautulliProxyConfig): string {
  const protocol = config.useSsl ? 'https' : 'http';
  return `${protocol}://${config.hostname}:${config.port}`;
}

function normalizeUrlBase(urlBase: string): string {
  const withSlash = urlBase.startsWith('/') ? urlBase : `/${urlBase}`;
  return withSlash.replace(/\/$/, '');
}

/**
 * Creates a proxy for Tautulli.
 */
export function createTautulliProxy(config: TautulliProxyConfig) {
  const urlBase = normalizeUrlBase(config.urlBase);

  return createProxyMiddleware({
    target: getTarget(config),
    changeOrigin: true,
    autoRewrite: true,
    router: () => getTarget(config),
    // Rewrite path to include the base URL that Tautulli expects
    pathRewrite: (path) => `${urlBase}${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;

        // Forward client IP
        const clientIp =
          expressReq.ip || req.socket?.remoteAddress || 'unknown';
        proxyReq.setHeader('X-Real-IP', clientIp);
        proxyReq.setHeader('X-Forwarded-For', clientIp);

        // Forward host/port/protocol for correct URL generation
        // Check for existing headers from upstream proxy (nginx) first
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
      },
      proxyRes: (proxyRes) => {
        // Rewrite redirects if needed
        const location = proxyRes.headers['location'];
        if (location && typeof location === 'string') {
          const target = getTarget(config);
          if (location.startsWith(target)) {
            proxyRes.headers['location'] = location.replace(target, '');
          }
        }
      },
      error: (err, req, res) => {
        logger.error(`Tautulli proxy error: ${err.message}`, {
          label: 'Proxy',
          path: req.url,
        });

        if (res && 'headersSent' in res && !res.headersSent) {
          (res as Response).status(502).json({
            status: 502,
            error: 'Service unavailable',
            message: 'Unable to connect to Tautulli',
          });
        }
      },
    },
  });
}
