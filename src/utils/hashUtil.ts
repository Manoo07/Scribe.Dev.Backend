import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '@constants/constants';
import { logger } from '@services/logService';

export const hashPassword = async (password: string): Promise<string> => {
  logger.info('[HashUtils] Hashing password');
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  logger.info('[HashUtils] Comparing hash & plain string password');
  return await bcrypt.compare(password, hashedPassword);
};
