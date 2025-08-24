import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';

type LogoUploadResult = {
  customLogo?: string;
  customLogoSmall?: string;
};

type LogoFile = {
  fieldname: string;
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

class LogoUpload {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = process.env.CONFIG_DIRECTORY
      ? `${process.env.CONFIG_DIRECTORY}/cache/images/logos`
      : path.join(process.cwd(), 'config/cache/images/logos');
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create logos directory', {
        label: 'Logo',
        error: error.message,
      });
      throw error;
    }
  }

  public async uploadLogos(files: LogoFile[]): Promise<LogoUploadResult> {
    await this.ensureUploadsDir();

    const settings = getSettings();
    const updates: LogoUploadResult = {};

    for (const file of files) {
      const fieldName = file.fieldname;
      const filename =
        fieldName === 'customLogo' ? 'logo_full.png' : 'logo_sm.png';
      const filePath = path.join(this.uploadsDir, filename);

      await writeFile(filePath, file.buffer);

      const timestamp = Date.now();
      if (fieldName === 'customLogo') {
        updates.customLogo = `/logo/${filename}?v=${timestamp}`;
      } else if (fieldName === 'customLogoSmall') {
        updates.customLogoSmall = `/logo/${filename}?v=${timestamp}`;
      }
    }

    settings.main = { ...settings.main, ...updates };
    settings.save();

    return updates;
  }

  public async deleteLogo(type: 'logo' | 'logoSmall'): Promise<void> {
    const settings = getSettings();

    if (type === 'logo' && settings.main.customLogo) {
      const urlPath = settings.main.customLogo.split('?')[0];
      const filename = path.basename(urlPath);
      const filePath = path.join(this.uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      settings.main = { ...settings.main, customLogo: undefined };
    } else if (type === 'logoSmall' && settings.main.customLogoSmall) {
      const urlPath = settings.main.customLogoSmall.split('?')[0];
      const filename = path.basename(urlPath);
      const filePath = path.join(this.uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      settings.main = { ...settings.main, customLogoSmall: undefined };
    }

    settings.save();
  }

  public getLogoPath(filename: string): string {
    // Defensive: prevent directory traversal in case function is misused
    if (filename.includes('..') || path.basename(filename) !== filename) {
      throw new Error('Invalid filename');
    }
    return path.join(this.uploadsDir, filename);
  }
}

export default LogoUpload;
