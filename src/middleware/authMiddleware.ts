import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwtUtil';
import { HTTP_STATUS_UNAUTHORIZED } from '@constants/constants';
import { logger } from '@services/logService';

interface AuthenticatedUser {
  id: string;
  role: string;
}
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
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
  const decoded: any = verifyToken(token);

  if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.role) {
    logger.warn(`[AUTH] Invalid / expired token │ IP=${req.ip} │ URL=${req.originalUrl}`);
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }



  req.user = { id: decoded.id, role: decoded.role };
  logger.info(
    `[AUTH] User authenticated │ IP=${req.ip} │ URL=${req.originalUrl} │ UserID=${JSON.stringify(decoded.id)}`
  );

  next();
};
