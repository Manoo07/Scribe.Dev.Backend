import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtil';
import '../types/express';
import { HTTP_STATUS_UNAUTHORIZED } from '../constants/constants';

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Unauthorized' });
  }

  req.user = decoded;
  next();
};
