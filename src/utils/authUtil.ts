import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS, DIGEST_FORMAT, HASH_ALGORITHM } from '../constants/constants';

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString(DIGEST_FORMAT);
  const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
  return { token, hashed };
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}
