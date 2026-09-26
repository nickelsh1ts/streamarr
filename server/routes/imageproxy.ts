import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import ImageProxy, { type ImageResponse } from '@server/lib/imageproxy';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import type { Response } from 'express';
import { Router } from 'express';

const router = Router();

const PLEX_IMAGE_PATH_REGEX = /^\/library\/metadata\/\d+\/thumb(\/\d+)?$/;
const TMDB_IMAGE_PATH_REGEX =
  /^\/t\/p\/[a-zA-Z0-9_(),]+\/[a-zA-Z0-9_\-.]+\.(?:jpg|jpeg|png|webp)$/i;
const TVDB_ARTWORK_HOST = 'artworks.thetvdb.com';
const TVDB_MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const TVDB_ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const TVDB_PATH_SEGMENT_REGEX = /^[A-Za-z0-9._~!$&'()+,;=@-]+$/;
const TVDB_IMAGE_EXTENSION_REGEX = /\.(?:jpe?g|png|webp|gif)$/i;
const PLEX_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

let plexTokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0,
};

const validateImageContentType = (
  headers: Record<string, unknown>,
  label: string,
  allowedContentTypes?: ReadonlySet<string>
) => {
  const contentType = headers['content-type'];
  const mimeType =
    typeof contentType === 'string'
      ? contentType.split(';', 1)[0].trim().toLowerCase()
      : '';

  if (
    !mimeType.startsWith('image/') ||
    (allowedContentTypes && !allowedContentTypes.has(mimeType))
  ) {
    throw new Error(
      `Invalid ${label} image content type: ${String(contentType)}`
    );
  }
};

const validateTvdbRedirect = (options: Record<string, unknown>) => {
  const host = String(options.hostname ?? options.host ?? '');
  const port =
    typeof options.hostname === 'string' &&
    options.port !== undefined &&
    options.port !== ''
      ? `:${String(options.port)}`
      : '';
  const target =
    typeof options.href === 'string'
      ? options.href
      : `${String(options.protocol ?? 'https:')}//${host}${port}${String(options.path ?? '')}`;

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(target);
  } catch {
    throw new Error('Invalid TVDB image redirect URL.');
  }

  if (
    redirectUrl.protocol !== 'https:' ||
    redirectUrl.hostname !== TVDB_ARTWORK_HOST ||
    redirectUrl.port ||
    redirectUrl.username ||
    redirectUrl.password
  ) {
    throw new Error('TVDB image redirect left the artwork host.');
  }
};

const isValidTvdbImagePath = (segments: string[]): boolean =>
  segments.length > 0 &&
  segments.every(
    (segment) =>
      segment !== '.' &&
      segment !== '..' &&
      TVDB_PATH_SEGMENT_REGEX.test(segment)
  ) &&
  TVDB_IMAGE_EXTENSION_REGEX.test(segments[segments.length - 1]);

const sendImageResponse = (res: Response, imageData: ImageResponse) => {
  const extension = imageData.meta.extension.toLowerCase();
  res.writeHead(200, {
    'Content-Type':
      extension === 'jpg' || extension === 'jpeg'
        ? 'image/jpeg'
        : `image/${extension}`,
    'Content-Length': imageData.imageBuffer.length,
    'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
    'Streamarr-Cache-Key': imageData.meta.cacheKey,
    'Streamarr-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
  });
  res.end(imageData.imageBuffer);
};

const proxyImage = async (
  res: Response,
  imageProxy: ImageProxy,
  imagePath: string,
  source: string
) => {
  try {
    const imageData = await imageProxy.getImage(imagePath);
    sendImageResponse(res, imageData);
  } catch (e) {
    logger.error(`Failed to proxy ${source} image`, {
      label: 'Image Proxy',
      imagePath,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    res.status(500).send();
  }
};

const getPlexAdminToken = async (): Promise<{
  token: string | null;
  tokenChanged: boolean;
}> => {
  const now = Date.now();
  if (plexTokenCache.token && now < plexTokenCache.expiresAt) {
    return { token: plexTokenCache.token, tokenChanged: false };
  }

  const previousToken = plexTokenCache.token;
  const token = await getAdminPlexToken();

  plexTokenCache = token
    ? { token, expiresAt: now + PLEX_TOKEN_TTL_MS }
    : { token: null, expiresAt: 0 };

  return { token, tokenChanged: previousToken !== token };
};

router.get('/plex', isAuthenticated(), async (req, res) => {
  const plexPath = req.query.path as string;

  if (!plexPath || !PLEX_IMAGE_PATH_REGEX.test(plexPath)) {
    return res.status(400).send('Invalid path');
  }

  const settings = getSettings();
  const { ip, port, useSsl } = settings.plex;

  if (!ip || !port) {
    return res.status(503).send('Plex not configured');
  }

  try {
    const { token: plexToken, tokenChanged } = await getPlexAdminToken();

    if (!plexToken) {
      return res.status(503).send('Plex token not available');
    }

    const protocol = useSsl ? 'https' : 'http';
    const plexBaseUrl = `${protocol}://${ip}:${port}`;
    const plexImageProxy = ImageProxy.getOrCreate(
      'plex',
      plexBaseUrl,
      {
        headers: { 'X-Plex-Token': plexToken },
        defaultMaxAge: 2419200,
        rateLimitOptions: { maxRequests: 20, maxRPS: 50 },
        validateResponse: (headers) =>
          validateImageContentType(headers, 'Plex'),
      },
      tokenChanged
    );

    await proxyImage(res, plexImageProxy, plexPath, 'Plex');
  } catch (e) {
    logger.error('Failed to proxy Plex image', {
      label: 'Image Proxy',
      plexPath,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    res.status(500).send();
  }
});

const tmdbImageProxy = new ImageProxy('tmdb', 'https://image.tmdb.org', {
  rateLimitOptions: { maxRequests: 20, maxRPS: 50 },
  validateResponse: (headers) => validateImageContentType(headers, 'TMDB'),
});

const tvdbImageProxy = new ImageProxy('tvdb', `https://${TVDB_ARTWORK_HOST}`, {
  defaultMaxAge: 60 * 60 * 24,
  maxContentLength: TVDB_MAX_IMAGE_SIZE_BYTES,
  maxRedirects: 5,
  beforeRedirect: validateTvdbRedirect,
  rateLimitOptions: { maxRequests: 20, maxRPS: 50 },
  validateResponse: (headers) =>
    validateImageContentType(headers, 'TVDB', TVDB_ALLOWED_CONTENT_TYPES),
});

router.get<{ path: string[] }>('/tvdb/*path', async (req, res) => {
  const pathSegments = req.params.path;
  if (!isValidTvdbImagePath(pathSegments)) {
    return res.status(400).send('Invalid TVDB image path');
  }

  const imagePath = `/${pathSegments.join('/')}`;
  return proxyImage(res, tvdbImageProxy, imagePath, 'TVDB');
});

const proxyTmdbImage = (res: Response, imagePath: string) => {
  const normalizedPath = imagePath.replace(/\/+/g, '/');

  if (!TMDB_IMAGE_PATH_REGEX.test(normalizedPath)) {
    logger.error('Invalid URL for image proxy', {
      label: 'Image Proxy',
      imagePath: normalizedPath,
    });
    return res.status(400).send('Invalid URL for image proxy');
  }

  return proxyImage(res, tmdbImageProxy, normalizedPath, 'TMDB');
};

router.get<{ path: string[] }>('/tmdb/*path', (req, res) => {
  return proxyTmdbImage(res, `/${req.params.path.join('/')}`);
});

router.get<{ path: string[] }>('/image/t/p/*path', (req, res) => {
  return proxyTmdbImage(res, `/t/p/${req.params.path.join('/')}`);
});

// Keep URLs embedded in previously delivered newsletters working.
router.get<{ path: string[] }>('/t/p/*path', (req, res) => {
  return proxyTmdbImage(res, `/t/p/${req.params.path.join('/')}`);
});

export default router;
