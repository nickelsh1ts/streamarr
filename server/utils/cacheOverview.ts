import ImageProxy from '@server/lib/imageproxy';
import QRCodeProxy from '@server/lib/qrcodeproxy';

export type ImageCacheOverview = {
  tmdb: { size: number; imageCount: number };
  plex: { size: number; imageCount: number };
  avatar: { size: number; imageCount: number };
  qrcode: { size: number; imageCount: number };
};

export type CacheOverviewResult = {
  imageCache: ImageCacheOverview;
  cachedAt: number;
};

const IMAGE_CACHE_TTL_MS = 60 * 1000;

let imageCacheOverviewCache: {
  expiresAt: number;
  promise: Promise<CacheOverviewResult>;
} | null = null;

const computeImageCacheOverview = async (): Promise<CacheOverviewResult> => {
  const qrProxy = new QRCodeProxy();

  const [tmdb, plex, avatar, qrcode] = await Promise.all([
    ImageProxy.getImageStats('tmdb'),
    ImageProxy.getImageStats('plex'),
    ImageProxy.getImageStats('avatar'),
    qrProxy.getCacheStats(),
  ]);

  return {
    imageCache: { tmdb, plex, avatar, qrcode },
    cachedAt: Date.now(),
  };
};

export const getCachedImageCacheOverview = async ({
  force = false,
}: { force?: boolean } = {}): Promise<CacheOverviewResult> => {
  const now = Date.now();

  if (
    !force &&
    imageCacheOverviewCache &&
    imageCacheOverviewCache.expiresAt > now
  ) {
    return imageCacheOverviewCache.promise;
  }

  const promise = computeImageCacheOverview();
  imageCacheOverviewCache = {
    expiresAt: now + IMAGE_CACHE_TTL_MS,
    promise,
  };

  promise.catch(() => {
    if (imageCacheOverviewCache?.promise === promise) {
      imageCacheOverviewCache = null;
    }
  });

  return promise;
};
