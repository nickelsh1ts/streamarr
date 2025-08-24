import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import qrcode from 'qrcode';
import logger from '@server/logger';

const baseCacheDirectory = process.env.CONFIG_DIRECTORY
  ? `${process.env.CONFIG_DIRECTORY}/cache/images/qrcode`
  : path.join(__dirname, '../../config/cache/images/qrcode');

class QRCodeProxy {
  private cacheVersion: number;

  constructor(cacheVersion = 1) {
    this.cacheVersion = cacheVersion;
  }

  public getCacheKey(inviteId: number | string, icode: string) {
    return this.getHash([inviteId, this.cacheVersion, icode]);
  }

  private getHash(items: (string | number | Buffer)[]) {
    const hash = createHash('sha256');
    for (const item of items) {
      if (typeof item === 'number') hash.update(String(item));
      else hash.update(item);
    }
    // Use URL-safe base64 encoding for cache keys
    return hash
      .digest('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=+$/, '');
  }

  public getCacheDirectory() {
    return baseCacheDirectory;
  }

  private getFilePath(cacheKey: string) {
    return path.join(this.getCacheDirectory(), `${cacheKey}.png`);
  }

  public async getQRCode(
    inviteId: number | string,
    icode: string,
    inviteUrl: string
  ): Promise<Buffer> {
    const cacheKey = this.getCacheKey(inviteId, icode);
    const filePath = this.getFilePath(cacheKey);
    try {
      return await fs.readFile(filePath);
    } catch {
      // Not cached, generate and cache
      try {
        const qrBuffer = await qrcode.toBuffer(inviteUrl, {
          type: 'png',
          width: 512,
        });
        await fs.mkdir(this.getCacheDirectory(), { recursive: true });
        await fs.writeFile(filePath, qrBuffer);
        return qrBuffer;
      } catch (e) {
        logger.error('Failed to generate QR code', {
          label: 'QRCodeProxy',
          errorMessage: e.message,
          inviteId,
          icode,
          inviteUrl,
        });
        throw e;
      }
    }
  }

  public async getImage(cacheKey: string) {
    const filePath = this.getFilePath(cacheKey);
    try {
      const imageBuffer = await fs.readFile(filePath);
      return {
        imageBuffer,
        meta: {
          extension: 'png',
          cacheKey,
          cacheMiss: false,
          curRevalidate: 86400,
        },
      };
    } catch (e) {
      logger.error('Failed to read cached QR code image', {
        label: 'QRCodeProxy',
        errorMessage: e.message,
        cacheKey,
      });
      return null;
    }
  }

  public async deleteImage(cacheKey: string) {
    const filePath = this.getFilePath(cacheKey);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (e) {
      if (e.code !== 'ENOENT') {
        logger.error('Failed to delete cached QR code image', {
          label: 'QRCodeProxy',
          errorMessage: e.message,
          cacheKey,
        });
      }
      return false;
    }
  }
}

export default QRCodeProxy;
