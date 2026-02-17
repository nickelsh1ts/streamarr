import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import type { Permission } from '@server/lib/permissions';
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';
import rateLimit from 'express-rate-limit';

export interface ImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface ImageUploadResult {
  url: string;
  filename: string;
}

export interface ImageUploadServiceConfig {
  directory: string;
  urlPrefix: string;
  label?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface RouterConfig {
  requireAuth?: boolean;
  permissions?: Permission | Permission[];
}

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const DEFAULT_QUALITY = 85;

export class ImageUploadService {
  private uploadsDir: string;
  private urlPrefix: string;
  private label: string;
  private maxWidth: number;
  private maxHeight: number;
  private quality: number;

  constructor(config: ImageUploadServiceConfig) {
    const baseDir = process.env.CONFIG_DIRECTORY
      ? `${process.env.CONFIG_DIRECTORY}/cache/images`
      : path.join(process.cwd(), 'config/cache/images');

    this.uploadsDir = path.join(baseDir, config.directory);
    this.urlPrefix = config.urlPrefix;
    this.label = config.label ?? config.directory;
    this.maxWidth = config.maxWidth ?? DEFAULT_MAX_WIDTH;
    this.maxHeight = config.maxHeight ?? DEFAULT_MAX_HEIGHT;
    this.quality = config.quality ?? DEFAULT_QUALITY;
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create images directory', {
        label: this.label,
        error: error.message,
      });
      throw error;
    }
  }

  private generateFilename(buffer: Buffer, extension: string): string {
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const timestamp = Date.now();
    return `${hash}-${timestamp}${extension}`;
  }

  private getOutputFormat(mimetype: string): {
    format: 'jpeg' | 'png' | 'webp';
    extension: string;
  } {
    switch (mimetype) {
      case 'image/png':
        return { format: 'png', extension: '.png' };
      case 'image/webp':
        return { format: 'webp', extension: '.webp' };
      case 'image/jpeg':
      case 'image/jpg':
      default:
        return { format: 'jpeg', extension: '.jpg' };
    }
  }

  private async processImage(
    buffer: Buffer,
    mimetype: string
  ): Promise<{ buffer: Buffer; extension: string }> {
    const { format, extension } = this.getOutputFormat(mimetype);

    let sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();

    if (
      (metadata.width && metadata.width > this.maxWidth) ||
      (metadata.height && metadata.height > this.maxHeight)
    ) {
      sharpInstance = sharpInstance.resize(this.maxWidth, this.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    let processedBuffer: Buffer;
    switch (format) {
      case 'png':
        processedBuffer = await sharpInstance
          .png({ quality: this.quality, compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        processedBuffer = await sharpInstance
          .webp({ quality: this.quality })
          .toBuffer();
        break;
      case 'jpeg':
      default:
        processedBuffer = await sharpInstance
          .jpeg({ quality: this.quality, mozjpeg: true })
          .toBuffer();
        break;
    }

    return { buffer: processedBuffer, extension };
  }

  public async uploadImage(file: ImageFile): Promise<ImageUploadResult> {
    await this.ensureUploadsDir();

    try {
      const { buffer: processedBuffer, extension } = await this.processImage(
        file.buffer,
        file.mimetype
      );

      const filename = this.generateFilename(processedBuffer, extension);
      const filePath = path.join(this.uploadsDir, filename);

      await writeFile(filePath, processedBuffer);

      const timestamp = Date.now();
      return {
        url: `${this.urlPrefix}/${filename}?v=${timestamp}`,
        filename,
      };
    } catch (error) {
      logger.error('Failed to upload image', {
        label: this.label,
        error: error.message,
      });
      throw error;
    }
  }

  public async deleteImage(filename: string): Promise<void> {
    if (filename.includes('..') || path.basename(filename) !== filename) {
      throw new Error('Invalid filename');
    }

    const filePath = path.join(this.uploadsDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
        logger.debug(`Image deleted: ${filename}`, {
          label: this.label,
        });
      }
    } catch (error) {
      logger.error('Failed to delete image', {
        label: this.label,
        error: error.message,
        filename,
      });
      throw error;
    }
  }

  public getImagePath(filename: string): string {
    if (filename.includes('..') || path.basename(filename) !== filename) {
      throw new Error('Invalid filename');
    }

    return path.join(this.uploadsDir, filename);
  }

  public imageExists(filename: string): boolean {
    if (filename.includes('..') || path.basename(filename) !== filename) {
      return false;
    }

    const filePath = path.join(this.uploadsDir, filename);
    return fs.existsSync(filePath);
  }

  public getFilenameFromUrl(url: string): string | null {
    if (!url) {
      return null;
    }

    const urlWithoutQuery = url.split('?')[0];
    const segments = urlWithoutQuery.split('/');
    const filename = segments[segments.length - 1];

    if (filename && /\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
      return filename;
    }

    return null;
  }

  public createRouter(config: RouterConfig = {}): Router {
    const router = Router();
    const { requireAuth = true, permissions } = config;

    const authMiddleware = requireAuth
      ? permissions
        ? isAuthenticated(permissions)
        : isAuthenticated()
      : (_req: unknown, _res: unknown, next: () => void) => next();

    const imageRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 image requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });

    router.get(
      '/:filename',
      authMiddleware,
      imageRateLimiter,
      (req, res): void => {
        const { filename } = req.params;

        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(this.uploadsDir, sanitizedFilename);

        if (!fs.existsSync(filePath)) {
          logger.warn('Image not found', {
            label: this.label,
            filename: sanitizedFilename,
          });
          res.status(404).send('Image not found');
          return;
        }

        const ext = path.extname(sanitizedFilename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
    );

    return router;
  }
}

export default ImageUploadService;
