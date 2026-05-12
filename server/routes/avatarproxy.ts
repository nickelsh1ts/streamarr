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

// Only allow avatars from these known, trusted hosts
const ALLOWED_AVATAR_HOSTS = new Set([
  'plex.tv',
  'metadata.provider.plex.tv',
  'secure.gravatar.com',
  'www.gravatar.com',
  'gravatar.com',
  'i.imgur.com',
  'cdn.discordapp.com',
]);

function isValidAvatarUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    // Check exact match or subdomain match for allowed hosts
    return [...ALLOWED_AVATAR_HOSTS].some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
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
    const avatarAllowed = !!dbAvatar && isValidAvatarUrl(dbAvatar);
    if (dbAvatar && !avatarAllowed) {
      logger.warn('Avatar URL not in allowlist, falling back to default', {
        label: 'Avatar Proxy',
        userId,
        avatarHost: URL.canParse(dbAvatar)
          ? new URL(dbAvatar).hostname
          : 'unknown',
      });
    }
    const avatarUrl = avatarAllowed ? dbAvatar : DEFAULT_AVATAR;

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
