import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';
import axios from 'axios';
import rateLimit, { type rateLimitOptions } from 'axios-rate-limit';
import { createHash } from 'crypto';
import { promises } from 'fs';
import path, { join } from 'path';

type ImageResponse = {
  meta: {
    revalidateAfter: number;
    curRevalidate: number;
    isStale: boolean;
    etag: string;
    extension: string;
    cacheKey: string;
    cacheMiss: boolean;
  };
  imageBuffer: Buffer;
};

const baseCacheDirectory = process.env.CONFIG_DIRECTORY
  ? `${process.env.CONFIG_DIRECTORY}/cache/images`
  : path.join(__dirname, '../../config/cache/images');

class ImageProxy {
  public static async clearCache(key: string) {
    const settings = getSettings();

    if (!settings.main.cacheImages) {
      return;
    }

    let deletedImages = 0;
    const cacheDirectory = path.join(baseCacheDirectory, key);

    try {
      await promises.access(cacheDirectory);
    } catch {
      return;
    }

    const files = await promises.readdir(cacheDirectory);

    for (const file of files) {
      const filePath = path.join(cacheDirectory, file);
      const stat = await promises.lstat(filePath);

      if (stat.isDirectory()) {
        const imageFiles = await promises.readdir(filePath);

        for (const imageFile of imageFiles) {
          const [, expireAtSt] = imageFile.split('.');
          const expireAt = Number(expireAtSt);
          const now = Date.now();

          if (now > expireAt) {
            await promises.rm(path.join(filePath, imageFile));
            deletedImages += 1;
          }
        }
      }
    }

    logger.info(`Cleared ${deletedImages} stale image(s) from cache`, {
      label: 'Image Cache',
    });
  }

  public static async getImageStats(
    key: string
  ): Promise<{ size: number; imageCount: number }> {
    const cacheDirectory = path.join(baseCacheDirectory, key);

    const imageTotalSize = await ImageProxy.getDirectorySize(cacheDirectory);
    const imageCount = await ImageProxy.getImageCount(cacheDirectory);

    return { size: imageTotalSize, imageCount };
  }

  private static async getDirectorySize(dir: string): Promise<number> {
    try {
      const files = await promises.readdir(dir, { withFileTypes: true });
      const paths = files.map(async (file) => {
        const path = join(dir, file.name);
        if (file.isDirectory()) return await ImageProxy.getDirectorySize(path);
        if (file.isFile()) {
          const { size } = await promises.stat(path);
          return size;
        }
        return 0;
      });
      return (await Promise.all(paths))
        .flat(Infinity)
        .reduce((i, size) => i + size, 0);
    } catch {
      return 0;
    }
  }

  private static async getImageCount(dir: string) {
    try {
      const files = await promises.readdir(dir);
      return files.length;
    } catch {
      return 0;
    }
  }

  private static readonly instanceCache = new Map<string, ImageProxy>();

  public static getOrCreate(
    key: string,
    baseUrl: string,
    options: ConstructorParameters<typeof ImageProxy>[2] = {},
    forceNew = false
  ): ImageProxy {
    const cacheKey = `${key}::${baseUrl}`;
    if (!forceNew && ImageProxy.instanceCache.has(cacheKey)) {
      return ImageProxy.instanceCache.get(cacheKey)!;
    }
    const instance = new ImageProxy(key, baseUrl, options);
    ImageProxy.instanceCache.set(cacheKey, instance);
    return instance;
  }

  private axios;
  private cacheVersion;
  private key;
  private defaultMaxAge;

  constructor(
    key: string,
    baseUrl: string,
    options: {
      cacheVersion?: number;
      rateLimitOptions?: rateLimitOptions;
      headers?: Record<string, string>;
      defaultMaxAge?: number;
    } = {}
  ) {
    this.cacheVersion = options.cacheVersion ?? 1;
    this.key = key;
    this.defaultMaxAge = options.defaultMaxAge ?? 0;
    this.axios = axios.create({
      baseURL: baseUrl,
      withCredentials: false,
      headers: options.headers,
    });

    if (options.rateLimitOptions) {
      this.axios = rateLimit(this.axios, options.rateLimitOptions);
    }
  }

  public async getImage(path: string): Promise<ImageResponse> {
    const cacheKey = this.getCacheKey(path);

    const imageResponse = await this.get(cacheKey);

    if (!imageResponse) {
      const newImage = await this.set(path, cacheKey);

      if (!newImage) {
        throw new Error('Failed to load image');
      }

      return newImage;
    }

    // If the image is stale, revalidate in the background only when caching is enabled.
    const settings = getSettings();
    if (imageResponse.meta.isStale && settings.main.cacheImages) {
      this.set(path, cacheKey);
    }

    return imageResponse;
  }

  private async get(cacheKey: string): Promise<ImageResponse | null> {
    try {
      const directory = join(this.getCacheDirectory(), cacheKey);
      const files = await promises.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const [maxAgeSt, expireAtSt, etag, extension] = file.split('.');
        const buffer = await promises.readFile(join(directory, file));
        const expireAt = Number(expireAtSt);
        const maxAge = Number(maxAgeSt);

        return {
          meta: {
            curRevalidate: maxAge,
            revalidateAfter: expireAt,
            isStale: now > expireAt,
            etag,
            extension,
            cacheKey,
            cacheMiss: false,
          },
          imageBuffer: buffer,
        };
      }
    } catch {
      // No files. Treat as empty cache.
    }

    return null;
  }

  private async set(
    path: string,
    cacheKey: string
  ): Promise<ImageResponse | null> {
    try {
      const directory = join(this.getCacheDirectory(), cacheKey);
      const response = await this.axios.get(path, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data, 'binary');
      const pathExt = (path.split('.').pop() ?? '').toLowerCase();
      const knownExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const contentType = response.headers['content-type'] as
        | string
        | undefined;
      const extension = knownExts.includes(pathExt)
        ? pathExt
        : (contentType?.split('/')[1]?.split(';')[0]?.trim() ?? 'jpg');
      const parsedMaxAge = Number(
        ((response.headers['cache-control'] as string | undefined) ?? '').split(
          'max-age='
        )[1]
      );
      const maxAge = parsedMaxAge > 0 ? parsedMaxAge : this.defaultMaxAge;
      const expireAt = Date.now() + maxAge * 1000;
      const etag = (response.headers.etag ?? '').replace(/"/g, '');

      const settings = getSettings();
      if (settings.main.cacheImages) {
        await this.writeToCacheDir(
          directory,
          extension,
          maxAge,
          expireAt,
          buffer,
          etag
        );
      }

      return {
        meta: {
          curRevalidate: maxAge,
          revalidateAfter: expireAt,
          isStale: false,
          etag,
          extension,
          cacheKey,
          cacheMiss: true,
        },
        imageBuffer: buffer,
      };
    } catch (e) {
      logger.debug('Something went wrong caching image.', {
        label: 'Image Cache',
        errorMessage: e.message,
      });
      return null;
    }
  }

  private async writeToCacheDir(
    dir: string,
    extension: string,
    maxAge: number,
    expireAt: number,
    buffer: Buffer,
    etag: string
  ) {
    const filename = join(dir, `${maxAge}.${expireAt}.${etag}.${extension}`);

    await promises.rm(dir, { force: true, recursive: true }).catch(() => {
      // do nothing
    });

    await promises.mkdir(dir, { recursive: true });
    await promises.writeFile(filename, buffer);
  }

  private getCacheKey(path: string) {
    return this.getHash([this.key, this.cacheVersion, path]);
  }

  private getHash(items: (string | number | Buffer)[]) {
    const hash = createHash('sha256');
    for (const item of items) {
      if (typeof item === 'number') hash.update(String(item));
      else {
        hash.update(item);
      }
    }
    // See https://en.wikipedia.org/wiki/Base64#Filenames
    return hash.digest('base64').replace(/\//g, '-');
  }

  private getCacheDirectory() {
    return path.join(baseCacheDirectory, this.key);
  }
}

export default ImageProxy;
