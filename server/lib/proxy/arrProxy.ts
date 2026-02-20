import type { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '@server/logger';

export interface ArrServiceConfig {
  name: string;
  hostname: string;
  port: number;
  useSsl: boolean;
  baseUrl: string;
  apiKey: string;
  apiKeyHeader?: string; // Default: 'X-Api-Key', Bazarr uses 'X-API-KEY'
}

function getTarget(config: ArrServiceConfig): string {
  const protocol = config.useSsl ? 'https' : 'http';
  return `${protocol}://${config.hostname}:${config.port}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  const withSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return withSlash.replace(/\/$/, '');
}

export function createArrProxy(config: ArrServiceConfig) {
  const { name, apiKey, baseUrl, apiKeyHeader = 'X-Api-Key' } = config;
  const pathPrefix = normalizeBaseUrl(baseUrl);

  return createProxyMiddleware({
    target: getTarget(config),
    changeOrigin: true,
    autoRewrite: true,
    router: () => getTarget(config),
    pathRewrite: (path) => `${pathPrefix}${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        const expressReq = req as Request;
        proxyReq.setHeader(apiKeyHeader, apiKey);

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
