// Cache-busting for the hand-maintained /public stylesheets (tailwind.css,
// watch.css, request.css, tautulli.css). They live at stable URLs, so append a
// build-scoped token to bust CDN/browser caches on each build or release.
// `cssVersion` comes from next.config.mjs (commit SHA in CI, timestamp locally).
export const ASSET_VERSION = process.env.cssVersion || 'local';

export const withVersion = (href: string): string =>
  `${href}${href.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
