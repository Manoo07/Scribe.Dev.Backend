import jwt from 'jsonwebtoken';
import { JWT_EXPIRATION, JWT_SECRET } from '../constants/constants';
import { logger } from '../services/logService';

export const generateToken = (userId: string) => {
  logger.info('Generating token');
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyToken = (token: string) => {
  logger.info('Verifing the JWT token');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.warn('Error while verifing JWT token');
    return null;
  }
};
