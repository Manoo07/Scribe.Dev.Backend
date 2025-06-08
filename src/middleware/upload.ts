import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS_BAD_REQUEST } from '@constants/constants';
import { logger } from '@services/logService';

// Configure multer with a temporary destination
const upload = multer({ dest: 'uploads/' });

// Middleware to handle file upload under the field name 'file'
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      logger.error('[UPLOAD] Multer error:', err);
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'File upload failed', details: err.message });
    }

    const type = req.body.type;
    console.log('Request Body', req.body);

    if (type !== 'DOCUMENT') {
      // Skip file upload validation if not a document
      logger.info('[UPLOAD] Skipping file upload check, type is not "DOCUMENT".');
      return next();
    }

    if (!req.file) {
      logger.warn('[UPLOAD] Document type but no file uploaded');
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: 'No file uploaded' });
    }
    next();
  });
};
