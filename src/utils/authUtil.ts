import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS, DIGEST_FORMAT, HASH_ALGORITHM, RANDOM_BYTES_LENGTH } from '@constants/constants';
import { logger } from '@services/logService';

export function generateResetToken() {
  logger.info('Generating reset token');
  const token = crypto.randomBytes(RANDOM_BYTES_LENGTH).toString(DIGEST_FORMAT);
  const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
  return { token, hashed };
}

export async function hashPassword(password: string) {
  logger.info('Hashing password');
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  return hashedPassword;
}
