import type { Theme } from '@server/lib/settings';
import logger from '@server/logger';
import { parseColorToHex } from '@server/utils/themeColor';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware';

export interface SeerrProxyConfig {
  hostname: string;
  port: number;
  useSsl?: boolean;
  /** Configured URL base, e.g. "/seerr". Leading slash, no trailing slash. */
  base: string;
  /** Reads the current Streamarr theme so colour changes apply without restart. */
  getTheme: () => Theme;
}

function getTarget(config: SeerrProxyConfig): string {
  const protocol = config.useSsl ? 'https' : 'http';
  return `${protocol}://${config.hostname}:${config.port}`;
}

function normalizeBase(base: string): string {
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  return withSlash.replace(/\/$/, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Paths that should be streamed as-is (no buffering, no rewriting).
 * Operates on the upstream path (base already stripped by the mount).
 */
function isSeerrStaticAsset(path: string): boolean {
  const clean = path.split('?')[0];
  if (clean.startsWith('/_next/static')) return true;
  if (clean.startsWith('/images/')) return true;
  return /\.(?:js|css|woff2?|ttf|eot|png|jpe?g|gif|svg|webp|ico|map|webmanifest|txt)$/i.test(
    clean
  );
}

/**
 * The Turbopack runtime chunk(s) carry the single baked asset-base constant
 * (`/_next/`). These are the only assets the proxy must transform (rather than
 * stream), to rewrite that constant to `${base}/_next/` so the client runtime
 * loads and recognizes its chunks under the prefix. Matches Turbopack's
 * `turbopack-<hash>.js` naming under /_next/static/chunks.
 */
function isSeerrRuntimeChunk(path: string): boolean {
  const clean = path.split('?')[0];
  return /\/_next\/static\/chunks\/turbopack-[^/]*\.js$/.test(clean);
}

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

/**
 * Builds the per-install theme variables Seerr / theme-park consume. Kept in
 * sync with the variable map in src/components/Request and DynamicFrame so the
 * server-injected styling matches the live client-injected styling exactly.
 */
function buildSeerrThemeCss(theme: Theme): string {
  const primaryChannels = hexToRgb(
    parseColorToHex(theme.primary) ?? theme.primary
  );
  const base300Channels = hexToRgb(
    parseColorToHex(theme['base-300']) ?? theme['base-300']
  );

  const vars: Record<string, string> = {
    '--color-background-accent': theme.primary,
    '--accent-color': primaryChannels,
    '--color-brand-accent': theme.secondary,
    '--bs-primary': theme.primary,
    '--color-background-accent-focus': theme.primary,
    '--color-text-accent': theme.secondary,
    '--main-bg-color': theme['base-300'],
    '--modal-bg-color': theme['base-100'],
    '--drop-down-menu-bg': theme.neutral,
    '--text': theme['base-content'],
    '--text-hover': theme['base-content'],
    '--color-text-on-accent': theme['base-content'],
    '--link-color': theme.primary,
    '--button-color': theme.primary,
    '--button-color-hover': theme.secondary,
    '--plex-poster-unwatched': theme['base-content'],
    '--transparency-light-15': `rgba(${primaryChannels}, 0.15)`,
    '--overseerr-gradient': `linear-gradient(180deg, rgba(${primaryChannels}, 0.47) 0%, rgba(${base300Channels}, 1) 100%)`,
    '--label-text-color': theme['base-content'],
    '--tw-ring-color': theme.primary,
  };

  const decls = Object.entries(vars)
    .map(([name, value]) => `${name}:${value} !important;`)
    .join('');

  // Seerr reads these on :root and on the .react-chroma-dark wrapper.
  return `:root{${decls}}.react-chroma-dark{${decls}}`;
}

/**
 * Runtime shim injected into the <head> of every Seerr HTML document. Runs
 * before Seerr's own scripts. Pure ES5 string so it executes with no build step.
 */
function buildSeerrShim(base: string, nonce: string): string {
  const js = `(function(){
  var BASE=${JSON.stringify(base)};
  function isApp(u){return /^\\/(?:api\\/v1|_next|images|imageproxy|avatarproxy)(?:\\/|$)/.test(u);}
  function pre(u){
    if(typeof u!=='string'||!u)return u;
    if(u.charAt(0)!=='/'||u.charAt(1)==='/')return u;          // skip relative + protocol-relative
    if(u===BASE||u.indexOf(BASE+'/')===0)return u;             // already prefixed
    return isApp(u)?BASE+u:u;
  }
  // axios uses XHR in the browser -> covers every Seerr API call (GET/POST/...)
  var open=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){
    var a=[].slice.call(arguments);try{a[1]=pre(u);}catch(e){}return open.apply(this,a);
  };
  // fetch covers Next's /_next/data transitions during client navigation
  if(window.fetch){
    var f=window.fetch;
    window.fetch=function(input,init){
      try{
        if(typeof input==='string')input=pre(input);
        else if(input&&typeof input.url==='string'){var p=pre(input.url);if(p!==input.url)input=new Request(p,input);}
      }catch(e){}
      return f.call(this,input,init);
    };
  }
  // Prefix a root-relative path with BASE. No-op for relative, absolute,
  // protocol-relative, or already-prefixed URLs. Shared by the history and
  // window.open wraps below (unlike pre(), which only prefixes API/asset paths).
  function full(u){
    if(typeof u!=='string'||!u)return u;
    if(u.charAt(0)!=='/'||u.charAt(1)==='/')return u;
    if(u===BASE||u.indexOf(BASE+'/')===0)return u;
    return BASE+u;
  }
  // Keep the iframe address bar under BASE so reloads + Streamarr nav-sync work.
  // Seerr's router stores its own (unprefixed) "as" in history.state, so
  // back/forward still resolve correctly off state, not the URL.
  function wrapHistory(fn){
    return function(state,title,url){
      var a=[state,title,url];
      try{a[2]=full(url);}catch(e){}
      return fn.apply(this,a);
    };
  }
  history.pushState=wrapHistory(history.pushState);
  history.replaceState=wrapHistory(history.replaceState);
  // Seerr's Plex login opens a popup via window.open('/<loading route>') and
  // then points it at plex.tv. That path is root-relative, so without a prefix
  // the popup lands on the Streamarr origin root (a 404) before the redirect to
  // Plex. Prefix it with BASE; the absolute plex.tv URL set afterwards via
  // popup.location is left untouched.
  if(window.open){
    var wopen=window.open;
    window.open=function(url){
      var a=[].slice.call(arguments);
      try{if(typeof url==='string')a[0]=full(url);}catch(e){}
      return wopen.apply(this,a);
    };
  }
  // Active links + asPath-based navigation: Seerr's sidebar keys off
  // router.pathname (route table -> always unprefixed/correct), but several
  // hooks read router.asPath (useSearchInput stores it then router.push()es it
  // back; useUpdateQueryParams compares against it). At initial hydration Next
  // derives asPath from window.location, so it would carry the BASE prefix and
  // a later router.push(asPath) would target an unresolvable prefixed route.
  // Normalize asPath to the unprefixed path once Seerr's router exists; the
  // address bar stays under BASE via the history wrap above.
  function fixAsPath(){
    try{
      var r=window.next&&window.next.router;
      if(r&&typeof r.asPath==='string'&&(r.asPath===BASE||r.asPath.indexOf(BASE+'/')===0)){
        r.replace(r.asPath.slice(BASE.length)||'/',undefined,{shallow:true}).catch(function(){});
        return true;
      }
    }catch(e){}
    return false;
  }
  if(!fixAsPath()){
    var n=0,iv=setInterval(function(){if(fixAsPath()||++n>60)clearInterval(iv);},50);
  }
  // Streamarr already provides the PWA shell; disable Seerr's own service worker
  // inside the embed to avoid scope conflicts and stale rewritten caches.
  if(navigator.serviceWorker&&navigator.serviceWorker.register){
    navigator.serviceWorker.register=function(){return Promise.reject(new Error('seerr sw disabled in embed'));};
  }
})();`;
  return `<script nonce="${nonce}">${js}</script>`;
}

function rewriteSeerrHtml(
  html: string,
  base: string,
  theme: Theme,
  nonce: string
): string {
  let out = html;

  // 1) Next asset + data roots (script/link/preload tags, __NEXT_DATA__ refs).
  out = out.split('/_next/').join(`${base}/_next/`);

  // 2) Static head asset roots emitted by PWAHeader / manifest / favicons. These
  // are plain public/ paths that assetPrefix does NOT cover. Match only when
  // quoted so we never touch substrings inside words.
  const assetRoots = [
    '/favicon',
    '/apple-touch-icon',
    '/apple-splash',
    '/android-chrome',
    '/badge-',
    '/clock-icon',
    '/cog-icon',
    '/sparkles-icon',
    '/user-icon',
    '/os_',
    '/logo_',
    '/preview.jpg',
    '/site.webmanifest',
    '/robots.txt',
    '/images/',
    '/imageproxy/',
    '/avatarproxy/',
    '/sw.js',
  ];
  for (const root of assetRoots) {
    out = out.split(`"${root}`).join(`"${base}${root}`);
    out = out.split(`'${root}`).join(`'${base}${root}`);
  }

  // 3) Keep Next's higher-level route loader (/_next/data prefetch, dynamic page
  // chunks) aligned with the prefixed assets.
  if (/"assetPrefix":/.test(out)) {
    out = out.replace(/"assetPrefix":"[^"]*"/, `"assetPrefix":"${base}"`);
  } else {
    out = out.replace(
      /(<script id="__NEXT_DATA__"[^>]*>)(\{)/,
      `$1$2"assetPrefix":"${base}",`
    );
  }

  const inject =
    buildSeerrShim(base, nonce) +
    `<style id="streamarr-seerr-theme" nonce="${nonce}">${buildSeerrThemeCss(theme)}</style>`;
  out = out.includes('</head>')
    ? out.replace('</head>', `${inject}</head>`)
    : inject + out;

  return out;
}

function augmentSeerrCsp(csp: string, nonce: string): string {
  const source = `'nonce-${nonce}'`;
  const directives = csp
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

  const find = (name: string): number =>
    directives.findIndex((d) => {
      const lower = d.toLowerCase();
      return lower === name || lower.startsWith(`${name} `);
    });

  for (const name of ['script-src', 'style-src']) {
    const i = find(name) !== -1 ? find(name) : find('default-src');
    if (i !== -1 && !directives[i].includes(source)) {
      directives[i] = `${directives[i]} ${source}`;
    }
  }

  const fa = find('frame-ancestors');
  if (fa !== -1) {
    directives[fa] = "frame-ancestors 'self'";
  } else {
    directives.push("frame-ancestors 'self'");
  }

  return directives.join('; ');
}

function relaxSeerrFramingHeaders(res: ServerResponse, nonce: string): void {
  res.setHeader('x-frame-options', 'SAMEORIGIN');
  const csp = res.getHeader('content-security-policy');
  if (typeof csp === 'string' && csp) {
    res.setHeader('content-security-policy', augmentSeerrCsp(csp, nonce));
  }
}

function forwardClientHeaders(
  proxyReq: { setHeader: (k: string, v: string) => void },
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

/**
 * Computes the rewritten Location value, or undefined if no change is needed.
 * Pure so it can be applied to either res (selfHandleResponse path) or
 * proxyRes.headers (streaming path).
 */
function rewriteLocationValue(
  location: string | string[] | number | undefined,
  target: string,
  base: string
): string | undefined {
  if (typeof location !== 'string') return undefined;
  // Absolute redirect back to the upstream origin -> make relative under base.
  if (location.startsWith(target)) {
    return `${base}${location.slice(target.length)}`;
  }
  // Root-relative redirect (e.g. /login, /setup) -> prefix it.
  if (
    location.startsWith('/') &&
    !location.startsWith('//') &&
    location !== base &&
    location.indexOf(`${base}/`) !== 0
  ) {
    return `${base}${location}`;
  }
  return undefined;
}

function emitError(
  err: Error,
  res: unknown,
  target: string,
  path?: string
): void {
  const errorCode = (err as NodeJS.ErrnoException).code;
  logger.error(`Seerr proxy error: ${err.message}`, {
    label: 'Proxy',
    path,
    target,
    errorCode,
  });
  if (
    res &&
    typeof res === 'object' &&
    'headersSent' in res &&
    !(res as Response).headersSent
  ) {
    (res as Response).status(502).json({
      status: 502,
      error: 'Service unavailable',
      message: 'Unable to connect to Seerr',
      target,
      reason: err.message,
      code: errorCode,
    });
  }
}

/**
 * Body transform for a buffered proxy. Returns the (possibly rewritten) body;
 * return the original buffer to pass it through untouched.
 */
type SeerrResponseTransform = (
  buffer: Buffer,
  proxyRes: IncomingMessage,
  res: ServerResponse,
  base: string
) => Buffer | string;

/**
 * Shared factory for the Seerr proxies. All three forward to the same upstream,
 * strip the base prefix, forward client headers, and rewrite redirect Locations
 * back under the base. They differ only in which paths they match, whether the
 * body is buffered to transform it, and whether the cookie path is rewritten.
 *
 * Passing a `transform` buffers the response (selfHandleResponse); otherwise the
 * body streams through untouched.
 */
function createSeerrMiddleware(
  config: SeerrProxyConfig,
  pathFilter: (path: string) => boolean,
  opts: { cookiePathRewrite?: boolean; transform?: SeerrResponseTransform } = {}
) {
  const base = normalizeBase(config.base);
  const baseStrip = new RegExp(`^${escapeRegExp(base)}`);
  const target = getTarget(config);
  const { transform } = opts;

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    router: () => getTarget(config),
    selfHandleResponse: !!transform,
    pathFilter,
    pathRewrite: (path) => path.replace(baseStrip, '') || '/',
    ...(opts.cookiePathRewrite ? { cookiePathRewrite: { '*': base } } : {}),
    on: {
      proxyReq: (proxyReq, req) =>
        forwardClientHeaders(proxyReq, req as Request),
      // Buffered (transform) and streaming paths both rewrite redirect
      // Locations. The buffered path also restores the status code, which
      // responseInterceptor does not copy (without it, redirects collapse to
      // 200 and the Plex login flow breaks).
      proxyRes: transform
        ? responseInterceptor(async (buffer, proxyRes, _req, res) => {
            res.statusCode = proxyRes.statusCode ?? res.statusCode;
            const loc = rewriteLocationValue(
              proxyRes.headers['location'],
              target,
              base
            );
            if (loc) res.setHeader('location', loc);
            return transform(buffer, proxyRes, res, base);
          })
        : (proxyRes) => {
            const loc = rewriteLocationValue(
              proxyRes.headers['location'],
              target,
              base
            );
            if (loc) proxyRes.headers['location'] = loc;
          },
      error: (err, req, res) => emitError(err, res, target, req.url),
    },
  });
}

/**
 * Documents, /_next/data, and /api/v1. HTML is rewritten (asset roots prefixed,
 * shim + theme injected); everything else passes through. Static assets are
 * rejected here and handled by the asset / runtime proxies.
 */
export function createSeerrProxy(config: SeerrProxyConfig) {
  return createSeerrMiddleware(config, (path) => !isSeerrStaticAsset(path), {
    cookiePathRewrite: true,
    transform: (buffer, proxyRes, res, base) => {
      const type = String(proxyRes.headers['content-type'] || '');
      if (!type.includes('text/html')) {
        // JSON / data / redirects: not framed and carry no inline, so Seerr's
        // own framing/CSP headers are inert here and pass through untouched.
        return buffer;
      }
      const nonce = randomBytes(16).toString('base64');
      relaxSeerrFramingHeaders(res, nonce);
      return rewriteSeerrHtml(
        buffer.toString('utf8'),
        base,
        config.getTheme(),
        nonce
      );
    },
  });
}

/**
 * Streaming proxy for immutable, content-hashed static assets. No buffering, so
 * Seerr's own cache headers are preserved.
 */
export function createSeerrAssetProxy(config: SeerrProxyConfig) {
  return createSeerrMiddleware(
    config,
    (path) => isSeerrStaticAsset(path) && !isSeerrRuntimeChunk(path)
  );
}

/**
 * Transforms the Turbopack runtime chunk, rewriting its single baked asset-base
 * constant ("/_next/") to "${base}/_next/" so the client runtime loads and
 * recognizes its chunks under the prefix. See isSeerrRuntimeChunk.
 */
export function createSeerrRuntimeProxy(config: SeerrProxyConfig) {
  return createSeerrMiddleware(config, isSeerrRuntimeChunk, {
    transform: (buffer, proxyRes, _res, base) => {
      const type = String(proxyRes.headers['content-type'] ?? '');
      if (!type.includes('javascript')) {
        return buffer; // not JS (unexpected): pass through
      }
      return buffer
        .toString('utf8')
        .split('"/_next/"')
        .join(`"${base}/_next/"`);
    },
  });
}
