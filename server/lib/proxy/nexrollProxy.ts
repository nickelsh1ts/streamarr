import logger from '@server/logger';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware';

export interface NexrollProxyConfig {
  hostname: string;
  port: number;
  useSsl?: boolean;
  base: string;
}

function getTarget(config: NexrollProxyConfig): string {
  return `${config.useSsl ? 'https' : 'http'}://${config.hostname}:${config.port}`;
}

function normalizeBase(base: string): string {
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  return withSlash.replace(/\/$/, '');
}

function rewriteUpstreamPath(path: string, base: string): string {
  const stripped =
    path === base
      ? '/'
      : path.startsWith(`${base}/`)
        ? path.slice(base.length)
        : path.startsWith(`${base}?`)
          ? `/${path.slice(base.length)}`
          : path;
  const [pathname, query = ''] = stripped.split('?');
  if (pathname !== '/preroll-thumb') return stripped;

  const storedPath = new URLSearchParams(query).get('p');
  if (!storedPath) return stripped;

  const parts = storedPath.replace(/\\/g, '/').split('/').filter(Boolean);
  const thumbnailsIndex = parts.findIndex(
    (part) => part.toLowerCase() === 'thumbnails'
  );
  if (thumbnailsIndex < 0) return stripped;

  const thumbnailParts = parts.slice(thumbnailsIndex + 1);
  if (thumbnailParts.length < 2) return stripped;
  return `/thumbgen/${thumbnailParts.map(encodeURIComponent).join('/')}`;
}

function isDocumentPath(path: string): boolean {
  const clean = path.split('?')[0];
  return (
    clean === '/' ||
    clean === '/index.html' ||
    clean === '/manifest.json' ||
    clean === '/asset-manifest.json'
  );
}

function buildNexrollShim(base: string, nonce: string): string {
  const script = `(function(){
  var BASE=${JSON.stringify(base)};
  var ORIGIN=window.location.origin;
  window.NEXROLL_API_BASE=ORIGIN+BASE;
  function prefixed(url){
    return typeof url==='string'&&(url===BASE||url.indexOf(BASE+'/')===0||url.indexOf(BASE+'?')===0||url.indexOf(BASE+'#')===0);
  }
  function prefix(url){
    if(typeof url!=='string'||url.charAt(0)!=='/'||url.charAt(1)==='/'||prefixed(url))return url;
    return BASE+url;
  }
  function isNexrollUrl(value){
    try{
      var url=new URL(typeof value==='string'?value:value.url,window.location.href);
      return url.origin===ORIGIN&&prefixed(url.pathname);
    }catch(e){return false;}
  }
  var originalSetAttribute=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(name,value){
    var attribute=String(name).toLowerCase();
    if(attribute==='src'||attribute==='href')value=prefix(value);
    return originalSetAttribute.call(this,name,value);
  };
  function patchUrlProperty(prototype,name){
    try{
      var descriptor=Object.getOwnPropertyDescriptor(prototype,name);
      if(!descriptor||!descriptor.configurable||!descriptor.set)return;
      Object.defineProperty(prototype,name,{
        configurable:descriptor.configurable,
        enumerable:descriptor.enumerable,
        get:descriptor.get,
        set:function(value){return descriptor.set.call(this,prefix(value));}
      });
    }catch(e){}
  }
  patchUrlProperty(HTMLImageElement.prototype,'src');
  patchUrlProperty(HTMLMediaElement.prototype,'src');
  function csrf(){
    var match=document.cookie.match(/(?:^|;\\s*)XSRF-TOKEN=([^;]+)/);
    return match?decodeURIComponent(match[1]):'';
  }
  if(window.fetch){
    var originalFetch=window.fetch;
    window.fetch=function(input,init){
      try{
        var method=(init&&init.method)||(input&&input.method)||'GET';
        if(typeof input==='string')input=prefix(input);
        if(!/^(?:GET|HEAD|OPTIONS)$/i.test(method)&&isNexrollUrl(input)){
          init=Object.assign({},init||{});
          var headers=new Headers(init.headers||(input&&input.headers)||{});
          var token=csrf();
          if(token&&!headers.has('X-XSRF-TOKEN'))headers.set('X-XSRF-TOKEN',token);
          init.headers=headers;
        }
      }catch(e){}
      return originalFetch.call(this,input,init);
    };
  }
  try{
    if(navigator.serviceWorker){
      navigator.serviceWorker.getRegistrations=function(){return Promise.resolve([]);};
      navigator.serviceWorker.register=function(){return Promise.reject(new Error('NeXroll service worker disabled in Streamarr'));};
    }
    if(window.caches){
      window.caches.keys=function(){return Promise.resolve([]);};
    }
  }catch(e){}
})();`;

  return `<script nonce="${nonce}">${script}</script>`;
}

function rewriteHtml(html: string, base: string, nonce: string): string {
  let output = html;
  const roots = [
    '/static/',
    '/icons/',
    '/manifest.json',
    '/asset-manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    '/NeXroll_Logo_BLK.png',
    '/NeXroll_Logo_WHT.png',
  ];

  for (const root of roots) {
    output = output.split(`"${root}`).join(`"${base}${root}`);
    output = output.split(`'${root}`).join(`'${base}${root}`);
  }

  const shim = buildNexrollShim(base, nonce);
  return output.includes('</head>')
    ? output.replace('</head>', `${shim}</head>`)
    : shim + output;
}

function rewriteManifest(manifest: string, base: string): string {
  const rewriteValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.startsWith('/') &&
        !value.startsWith('//') &&
        value !== base &&
        !value.startsWith(`${base}/`)
        ? `${base}${value}`
        : value;
    }
    if (Array.isArray(value)) return value.map(rewriteValue);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, rewriteValue(entry)])
      );
    }
    return value;
  };

  try {
    return JSON.stringify(rewriteValue(JSON.parse(manifest)));
  } catch {
    return manifest;
  }
}

function augmentCsp(csp: string, nonce: string): string {
  const directives = csp
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean);
  const source = `'nonce-${nonce}'`;
  const find = (name: string): number =>
    directives.findIndex((directive) => {
      const lower = directive.toLowerCase();
      return lower === name || lower.startsWith(`${name} `);
    });
  const scriptIndex =
    find('script-src-elem') !== -1
      ? find('script-src-elem')
      : find('script-src');

  if (scriptIndex >= 0 && !directives[scriptIndex].includes(source)) {
    directives[scriptIndex] = `${directives[scriptIndex]} ${source}`;
  } else if (scriptIndex < 0) {
    const defaultIndex = find('default-src');
    if (defaultIndex >= 0 && !directives[defaultIndex].includes(source)) {
      directives[defaultIndex] = `${directives[defaultIndex]} ${source}`;
    }
  }

  const frameIndex = find('frame-ancestors');
  if (frameIndex >= 0) {
    directives[frameIndex] = "frame-ancestors 'self'";
  } else {
    directives.push("frame-ancestors 'self'");
  }

  return directives.join('; ');
}

function forwardClientHeaders(
  proxyReq: { setHeader: (key: string, value: string) => void },
  req: Request
): void {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  proxyReq.setHeader('X-Real-IP', clientIp);
  proxyReq.setHeader('X-Forwarded-For', clientIp);
  proxyReq.setHeader(
    'X-Forwarded-Proto',
    req.get('X-Forwarded-Proto') || req.protocol || 'http'
  );
  proxyReq.setHeader(
    'X-Forwarded-Host',
    req.get('X-Forwarded-Host') || req.get('Host') || ''
  );
}

function rewriteLocation(
  location: string | string[] | number | undefined,
  target: string,
  base: string
): string | undefined {
  if (typeof location !== 'string') return undefined;
  if (location.startsWith(target)) {
    return `${base}${location.slice(target.length)}`;
  }
  if (
    location.startsWith('/') &&
    !location.startsWith('//') &&
    location !== base &&
    !location.startsWith(`${base}/`)
  ) {
    return `${base}${location}`;
  }
  return undefined;
}

function emitError(err: Error, res: unknown, target: string, path?: string) {
  logger.error(`NeXroll proxy error: ${err.message}`, {
    label: 'Proxy',
    path,
    target,
    errorCode: (err as NodeJS.ErrnoException).code,
  });

  if (
    res &&
    typeof res === 'object' &&
    'headersSent' in res &&
    !(res as Response).headersSent
  ) {
    (res as Response).status(502).json({
      message: 'Unable to connect to NeXroll',
    });
  }
}

function createNexrollMiddleware(
  config: NexrollProxyConfig,
  pathFilter: (path: string) => boolean,
  transform?: (
    buffer: Buffer,
    proxyRes: IncomingMessage,
    res: ServerResponse,
    base: string
  ) => Buffer | string
) {
  const base = normalizeBase(config.base);
  const target = getTarget(config);

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    pathRewrite: (path) => rewriteUpstreamPath(path, base),
    cookieDomainRewrite: '',
    cookiePathRewrite: { '*': base },
    selfHandleResponse: !!transform,
    on: {
      proxyReq: (proxyReq, req) =>
        forwardClientHeaders(proxyReq, req as Request),
      proxyRes: transform
        ? responseInterceptor(async (buffer, proxyRes, _req, res) => {
            res.statusCode = proxyRes.statusCode ?? res.statusCode;
            const location = rewriteLocation(
              proxyRes.headers.location,
              target,
              base
            );
            if (location) res.setHeader('location', location);
            return transform(buffer, proxyRes, res, base);
          })
        : (proxyRes) => {
            const location = rewriteLocation(
              proxyRes.headers.location,
              target,
              base
            );
            if (location) proxyRes.headers.location = location;
          },
      error: (err, req, res) => emitError(err, res, target, req.url),
    },
  });
}

export function createNexrollDocumentProxy(config: NexrollProxyConfig) {
  return createNexrollMiddleware(
    config,
    isDocumentPath,
    (buffer, proxyRes, res, base) => {
      const contentType = String(proxyRes.headers['content-type'] ?? '');
      if (
        contentType.includes('application/json') ||
        contentType.includes('application/manifest+json')
      ) {
        return rewriteManifest(buffer.toString('utf8'), base);
      }
      if (!contentType.includes('text/html')) return buffer;

      const nonce = randomBytes(16).toString('base64');
      res.setHeader('x-frame-options', 'SAMEORIGIN');
      const csp = res.getHeader('content-security-policy');
      if (typeof csp === 'string' && csp) {
        res.setHeader('content-security-policy', augmentCsp(csp, nonce));
      }
      return rewriteHtml(buffer.toString('utf8'), base, nonce);
    }
  );
}

export function createNexrollStreamingProxy(config: NexrollProxyConfig) {
  return createNexrollMiddleware(config, (path) => !isDocumentPath(path));
}
