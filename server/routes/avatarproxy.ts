import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import ImageProxy from '@server/lib/imageproxy';
import { avatarLimiter } from '@server/lib/rateLimiters';
import logger from '@server/logger';
import { Router } from 'express';

const router = Router();

const DEFAULT_AVATAR =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mm&s=200';
const AVATAR_MAX_AGE = 60 * 60 * 24; // 24 hours

// Block loopback and RFC-1918 private address ranges to prevent SSRF
const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fe80:)/i;

function isValidAvatarUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && !PRIVATE_HOST_RE.test(hostname);
  } catch {
    return false;
  }
}

const validateAvatarImageResponse = (headers: Record<string, unknown>) => {
  const contentType = headers['content-type'];
  if (typeof contentType !== 'string' || !contentType.startsWith('image/')) {
    throw new Error(`Invalid avatar content type: ${String(contentType)}`);
  }
};

function getAvatarProxy(): ImageProxy {
  return ImageProxy.getOrCreate('avatar', '', {
    defaultMaxAge: AVATAR_MAX_AGE,
    validateResponse: validateAvatarImageResponse,
  });
}

router.use(avatarLimiter);

router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).send('Invalid user ID');
    }

    const user = await getRepository(User).findOne({
      select: ['id', 'avatar'],
      where: { id: userId },
    });
    const dbAvatar = user?.avatar;
    if (dbAvatar && !isValidAvatarUrl(dbAvatar)) {
      return res.status(400).send('Invalid avatar URL');
    }
    const avatarUrl = dbAvatar || DEFAULT_AVATAR;

    const proxy = getAvatarProxy();
    const imageData = await proxy.getImage(avatarUrl);

    // Respond 304 if client already has the current version
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === `"${imageData.meta.etag}"`) {
      return res.status(304).end();
    }

    res.writeHead(200, {
      'Content-Type': `image/${imageData.meta.extension}`,
      'Content-Length': imageData.imageBuffer.length,
      'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
      ETag: `"${imageData.meta.etag}"`,
      'Streamarr-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
      'Streamarr-Cache-Key': imageData.meta.cacheKey,
    });
    res.end(imageData.imageBuffer);
  } catch (e) {
    logger.error('Failed to proxy avatar image', {
      label: 'Avatar Proxy',
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    res.status(500).end();
  }
});

export default router;
