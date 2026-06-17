import { getAdminPlexToken } from '@server/lib/adminPlexToken';
import ImageProxy from '@server/lib/imageproxy';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const router = Router();

const PLEX_IMAGE_PATH_REGEX = /^\/library\/metadata\/\d+\/thumb(\/\d+)?$/;
const PLEX_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

let plexTokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0,
};

const validatePlexImageResponse = (headers: Record<string, unknown>) => {
  const contentType = headers['content-type'];
  if (typeof contentType !== 'string' || !contentType.startsWith('image/')) {
    throw new Error(`Invalid Plex image content type: ${String(contentType)}`);
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
        validateResponse: validatePlexImageResponse,
      },
      tokenChanged
    );

    const imageData = await plexImageProxy.getImage(plexPath);

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      'Streamarr-Cache-Key': imageData.meta.cacheKey,
      'Streamarr-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
    });
    res.end(imageData.imageBuffer);
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
});

router.get('/*splat', async (req, res) => {
  const imagePath = req.path.replace('/image', '');

  if (imagePath.startsWith('//') || imagePath.includes('://')) {
    logger.error('Invalid URL for image proxy', {
      label: 'Image Proxy',
      imagePath,
    });
    return res.status(403).send('Invalid URL for image proxy');
  }

  try {
    const imageData = await tmdbImageProxy.getImage(imagePath);

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      'Streamarr-Cache-Key': imageData.meta.cacheKey,
      'Streamarr-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
    });

    res.end(imageData.imageBuffer);
  } catch (e) {
    logger.error('Failed to proxy image', {
      label: 'Image Proxy',
      imagePath,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    res.status(500).send();
  }
});

export default router;
