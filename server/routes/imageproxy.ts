import ImageProxy from '@server/lib/imageproxy';
import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const router = Router();

let plexImageProxyToken: string | null = null;

router.get('/plex', isAuthenticated(), async (req, res) => {
  const plexPath = req.query.path as string;

  if (!plexPath || !plexPath.startsWith('/library/')) {
    return res.status(400).send('Invalid path');
  }

  const settings = getSettings();
  const { ip, port, useSsl } = settings.plex;

  if (!ip || !port) {
    return res.status(503).send('Plex not configured');
  }

  try {
    const admin = await getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.plexToken')
      .where('user.id = :id', { id: 1 })
      .getOne();

    if (!admin?.plexToken) {
      return res.status(503).send('Plex token not available');
    }

    const protocol = useSsl ? 'https' : 'http';
    const plexBaseUrl = `${protocol}://${ip}:${port}`;
    const tokenChanged = plexImageProxyToken !== admin.plexToken;
    const plexImageProxy = ImageProxy.getOrCreate(
      'plex',
      plexBaseUrl,
      {
        headers: { 'X-Plex-Token': admin.plexToken },
        defaultMaxAge: 2419200,
        rateLimitOptions: { maxRequests: 20, maxRPS: 50 },
      },
      tokenChanged
    );
    if (tokenChanged) {
      plexImageProxyToken = admin.plexToken;
    }

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
