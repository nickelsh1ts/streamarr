import ImageProxy from '@server/lib/imageproxy';
import { logoUpload } from '@server/lib/logoUpload';
import { newsletterImageService } from '@server/lib/newsletters/images';
import { onboardingImageService } from '@server/lib/onboarding';
import { qrProxy } from '@server/lib/qrcodeproxy';
import {
  getConfigDirectorySizes,
  getMeasuredDirectorySize,
  type DirectorySizes,
} from '@server/utils/directorySize';
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
  /** Null until the first background walk completes; sizes read as 0 until then. */
  cachedAt: number | null;
  refreshing: boolean;
};

// Upload directories are created lazily on first upload, so a missing one is expected.
const getDirectoryStats = async (
  directory: string,
  measured: DirectorySizes | null
): Promise<{ size: number; imageCount: number }> => {
  const filenames = await readdir(directory).catch(() => [] as string[]);

  return {
    size: getMeasuredDirectorySize(measured, directory),
    imageCount: filenames.length,
  };
};

/** Counts are read live; sizes come from the last background config walk. */
export const getCachedImageCacheOverview = async ({
  force = false,
}: { force?: boolean } = {}): Promise<CacheOverviewResult> => {
  const { measured, measuredAt, refreshing } = getConfigDirectorySizes({
    force,
  });
  const [tmdb, tvdb, plex, avatar, qrcode, logos, onboarding, newsletter] =
    await Promise.all([
      ImageProxy.getImageStats('tmdb', measured),
      ImageProxy.getImageStats('tvdb', measured),
      ImageProxy.getImageStats('plex', measured),
      ImageProxy.getImageStats('avatar', measured),
      qrProxy.getCacheStats(measured),
      getDirectoryStats(logoUpload.directory, measured),
      getDirectoryStats(onboardingImageService.directory, measured),
      getDirectoryStats(newsletterImageService.directory, measured),
    ]);

  return {
    imageCache: { tmdb, tvdb, plex, avatar, qrcode },
    uploads: { logos, onboarding, newsletter },
    cachedAt: measuredAt,
    refreshing,
  };
};
