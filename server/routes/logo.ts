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
    const filePath = logoUpload.getLogoPath(filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }

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
