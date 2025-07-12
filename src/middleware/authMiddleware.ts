import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwtUtil';
import { HTTP_STATUS_UNAUTHORIZED } from '@constants/constants';
import { logger } from '@services/logService';
import UserDAO from '@dao/userDAO';

interface AuthenticatedUser {
  id: string;
  role: string;
}
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn(`[AUTH] No Authorization header │ IP=${req.ip} │ URL=${req.originalUrl}`);
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn(`[AUTH] Malformed Authorization header │ IP=${req.ip} │ URL=${req.originalUrl}`);
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }

  let decoded: any;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    logger.warn(`[AUTH] Invalid/Expired JWT │ IP=${req.ip} │ URL=${req.originalUrl}`);
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }

  if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.role) {
    logger.warn(`[AUTH] Invalid / expired token │ IP=${req.ip} │ URL=${req.originalUrl}`);
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await UserDAO.get({ filter: { id: decoded.id } });

    if (!user || user.activeToken !== token) {
      logger.warn(`[AUTH] Token mismatch or user not found │ UserID=${decoded.id} │ IP=${req.ip}`);
      res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
      return;
    }

    req.user = { id: decoded.id, role: decoded.role };

    logger.info(`[AUTH] User authenticated │ IP=${req.ip} │ URL=${req.originalUrl} │ UserID=${decoded.id}`);
    next();
  } catch (error) {
    logger.error(`[AUTH] Middleware error while verifying user │ IP=${req.ip}`, error);
    res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
    return;
  }
};
