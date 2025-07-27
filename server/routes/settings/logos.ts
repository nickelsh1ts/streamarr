import { Router } from 'express';
import { isAuthenticated } from '@server/middleware/auth';
import { Permission } from '@server/lib/permissions';
import LogoUpload from '@server/lib/logoUpload';
import logger from '@server/logger';
import path from 'path';
import multer from 'multer';

const logoSettingsRoutes = Router();
const logoUpload = new LogoUpload();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/svg+xml',
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (
      allowedMimes.includes(file.mimetype) &&
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, SVG) are allowed'));
    }
  },
});

logoSettingsRoutes.post(
  '/upload',
  isAuthenticated(Permission.ADMIN),
  upload.any(),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
      }

      const updates = await logoUpload.uploadLogos(files);

      res.status(200).json({
        message: 'Logos uploaded successfully',
        ...updates,
      });
    } catch (error) {
      logger.error('Logo upload failed', {
        label: 'Settings',
        error: error.message,
      });
      next({ status: 500, message: 'Failed to upload logos' });
    }
  }
);

logoSettingsRoutes.delete(
  '/delete',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const { type } = req.body;

      await logoUpload.deleteLogo(type);

      res.status(200).json({ message: 'Logo deleted successfully' });
    } catch (error) {
      logger.error('Logo deletion failed', {
        label: 'Settings',
        error: error.message,
      });
      next({ status: 500, message: 'Failed to delete logo' });
    }
  }
);

export default logoSettingsRoutes;
