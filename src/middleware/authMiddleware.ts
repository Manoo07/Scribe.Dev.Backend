import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwtUtil';
import { HTTP_STATUS_UNAUTHORIZED } from '@constants/constants';
import { logger } from '@services/logService';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn(`[AUTH] No Authorization header │ IP=${req.ip} │ URL=${req.originalUrl}`);
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn(`[AUTH] Malformed Authorization header │ IP=${req.ip} │ URL=${req.originalUrl}`);
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn(`[AUTH] Invalid / expired token │ IP=${req.ip} │ URL=${req.originalUrl}`);
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }

  req.user = decoded;
  next();
};
