import csurf from '@dr.pogodin/csurf';
import type { TrustProxyFn } from '@server/lib/trustedProxies';
import type { RequestHandler } from 'express';
import type { IncomingMessage } from 'http';
import type { TLSSocket } from 'tls';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const HOST_CSRF_COOKIE = '__Host-streamarr.csrf';
const CSRF_COOKIE_NAMES = new Set([
  HOST_CSRF_COOKIE,
  'streamarr.csrf',
  '_csrf',
  'XSRF-TOKEN',
]);

export function matchesProxyPath(path: string, prefixes: string[]): boolean {
  const pathname = path.toLowerCase();
  return prefixes.some((value) => {
    const prefix = value.toLowerCase();
    return (
      pathname === prefix ||
      pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
    );
  });
}

export function isSameOrigin(
  req: IncomingMessage,
  trustProxy: TrustProxyFn
): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;

  let host = req.headers.host;
  let protocol = (req.socket as TLSSocket).encrypted ? 'https' : 'http';
  // Forwarded headers only count when they come from a trusted proxy
  if (trustProxy(req.socket.remoteAddress ?? '', 0)) {
    const forwardedHost = req.headers['x-forwarded-host'];
    const forwardedProtocol = req.headers['x-forwarded-proto'];
    if (typeof forwardedHost === 'string') {
      host = forwardedHost.split(',')[0].trim();
    }
    if (typeof forwardedProtocol === 'string') {
      protocol = forwardedProtocol.split(',')[0].trim().toLowerCase();
    }
  }
  if (!host || !['http', 'https'].includes(protocol)) return false;

  try {
    const source = new URL(origin);
    return (
      !source.username &&
      !source.password &&
      source.pathname === '/' &&
      !source.search &&
      !source.hash &&
      source.origin === new URL(`${protocol}://${host}`).origin
    );
  } catch {
    return false;
  }
}

export function createCsrfProtection(options: {
  isProxyPath: (path: string) => boolean;
  trustProxy: TrustProxyFn;
  secure: boolean;
}): RequestHandler {
  const cookie = {
    key: options.secure ? HOST_CSRF_COOKIE : 'streamarr.csrf',
    path: '/',
    httpOnly: true,
    sameSite: true,
    secure: options.secure,
  };
  const validateToken = csurf({ cookie });
  const validateProxyToken = csurf({
    cookie,
    value: (req) => req.get('X-XSRF-TOKEN') ?? '',
  });

  return (req, res, next) => {
    const proxyRequest = options.isProxyPath(req.path);
    if (proxyRequest) {
      if (SAFE_METHODS.has(req.method)) return next();
      if (req.headers.origin !== undefined) {
        if (isSameOrigin(req, options.trustProxy)) return next();
        return next({ status: 403, message: 'Invalid request origin.' });
      }
    }

    const validate = proxyRequest ? validateProxyToken : validateToken;
    validate(req, res, (error) => {
      if (error) return next(error);
      if (!proxyRequest) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          sameSite: true,
          secure: options.secure,
        });
      }
      next();
    });
  };
}

export function scopeProxyCsrfCookies(base: string): RequestHandler {
  return (_req, res, next) => {
    const originalSetHeader = res.setHeader;
    const existing = res.getHeader('set-cookie');
    const frameworkCookies = (
      Array.isArray(existing) ? existing : existing ? [String(existing)] : []
    ).filter((cookie) => CSRF_COOKIE_NAMES.has(cookie.split('=')[0]));

    res.setHeader = function (name, value) {
      if (name.toLowerCase() === 'set-cookie') {
        const cookies = (Array.isArray(value) ? value : [String(value)])
          .filter(
            (cookie) =>
              !frameworkCookies.includes(cookie) &&
              cookie.split('=')[0] !== HOST_CSRF_COOKIE
          )
          .map((cookie) => {
            const [pair, ...attributes] = cookie.split(';');
            if (!CSRF_COOKIE_NAMES.has(pair.split('=')[0])) return cookie;
            const path = attributes.find((attribute) =>
              /^\s*path=/i.test(attribute)
            );
            const cookiePath = path?.trim().slice(5);
            if (cookiePath === base || cookiePath?.startsWith(`${base}/`))
              return cookie;
            return [
              pair,
              ...attributes.filter(
                (attribute) => !/^\s*path=/i.test(attribute)
              ),
              ` Path=${base}`,
            ].join(';');
          });
        value = [...frameworkCookies, ...cookies];
      }
      return originalSetHeader.call(this, name, value);
    };
    next();
  };
}
