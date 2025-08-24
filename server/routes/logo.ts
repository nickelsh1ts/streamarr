import { Router } from 'express';
import LogoUpload from '@server/lib/logoUpload';
import logger from '@server/logger';
import path from 'path';
import fs from 'fs';

const logoRoutes = Router();
const logoUpload = new LogoUpload();

logoRoutes.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    // Only allow known filenames to prevent directory traversal and unauthorized access
    const ALLOWED_FILENAMES = ['logo_full.png', 'logo_sm.png'];
    if (!ALLOWED_FILENAMES.includes(filename)) {
      res.status(404).send('File not found');
      return;
    }
    const filePath = logoUpload.getLogoPath(filename);

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    const contentTypeMap: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    res.end(fileBuffer);
  } catch (error) {
    logger.error('Error serving logo file', {
      label: 'Logo',
      filename: req.params.filename,
      error: error.message,
    });
    res.status(500).send('Internal Server Error');
  }
});

export default logoRoutes;
