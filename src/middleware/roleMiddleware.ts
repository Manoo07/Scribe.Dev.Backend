import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS_FORBIDDEN } from '@constants/constants';
 
export const allowRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(HTTP_STATUS_FORBIDDEN)
        .json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};