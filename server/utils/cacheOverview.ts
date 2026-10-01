import ImageProxy from '@server/lib/imageproxy';
import { logoUpload } from '@server/lib/logoUpload';
import { newsletterImageService } from '@server/lib/newsletters/images';
import { onboardingImageService } from '@server/lib/onboarding';
import { qrProxy } from '@server/lib/qrcodeproxy';
import { getPathUsedBytes } from '@server/utils/pathSize';
import { readdir } from 'fs/promises';

export type ImageCacheOverview = {
  tmdb: { size: number; imageCount: number };
  tvdb: { size: number; imageCount: number };
  plex: { size: number; imageCount: number };
  avatar: { size: number; imageCount: number };
  qrcode: { size: number; imageCount: number };
};

export type UploadsOverview = {
  logos: { size: number; imageCount: number };
  onboarding: { size: number; imageCount: number };
  newsletter: { size: number; imageCount: number };
};

export type CacheOverviewResult = {
  imageCache: ImageCacheOverview;
  uploads: UploadsOverview;
  cachedAt: number;
};

const IMAGE_CACHE_TTL_MS = 60 * 1000;

const EMPTY_STATS = { size: 0, imageCount: 0 };

// Upload directories are created lazily on first upload, so measuring one that
// does not exist yet is expected rather than an error.
const getDirectoryStats = async (
  directory: string
): Promise<{ size: number; imageCount: number }> => {
  const filenames = await readdir(directory).catch(() => null);

  if (!filenames) {
    return EMPTY_STATS;
  }

  const size = await getPathUsedBytes(directory).catch(() => 0);

  return { size, imageCount: filenames.length };
};

let imageCacheOverviewCache: {
  expiresAt: number;
  promise: Promise<CacheOverviewResult>;
} | null = null;

const computeImageCacheOverview = async (): Promise<CacheOverviewResult> => {
  const [tmdb, tvdb, plex, avatar, qrcode, logos, onboarding, newsletter] =
    await Promise.all([
      ImageProxy.getImageStats('tmdb'),
      ImageProxy.getImageStats('tvdb'),
      ImageProxy.getImageStats('plex'),
      ImageProxy.getImageStats('avatar'),
      qrProxy.getCacheStats(),
      getDirectoryStats(logoUpload.directory),
      getDirectoryStats(onboardingImageService.directory),
      getDirectoryStats(newsletterImageService.directory),
    ]);

  return {
    imageCache: { tmdb, tvdb, plex, avatar, qrcode },
    uploads: { logos, onboarding, newsletter },
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
