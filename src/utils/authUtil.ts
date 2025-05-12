import crypto from 'crypto';
import bcrypt from 'bcrypt';
import {
  BCRYPT_SALT_ROUNDS,
  DIGEST_FORMAT,
  HASH_ALGORITHM,
  HTTP_STATUS_BAD_REQUEST,
  RANDOM_BYTES_LENGTH,
} from '@constants/constants';
import { logger } from '@services/logService';
import { SignupParams } from '@customTypes/user';
import { Role } from '@prisma/client';
import { ErrorResponse } from 'types/express';

export function generateResetToken() {
  logger.info('[AuthUtils] Generating reset token');
  const token = crypto.randomBytes(RANDOM_BYTES_LENGTH).toString(DIGEST_FORMAT);
  const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
  return { token, hashed };
}

export async function hashPassword(password: string) {
  logger.info('[AuthUtils] Hashing password');
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  return hashedPassword;
}

export function checkMissingFields(params: SignupParams): string[] | null {
  const { firstName, lastName, username, email, password, collegeId, role, departmentId } = params;
  const missing: string[] = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!username) missing.push('username');
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (!collegeId) missing.push('collegeId');
  if (!role) missing.push('role');
  if (!departmentId) missing.push('departmentId');

  return missing.length > 0 ? missing : null;
}

export function validateSignupParams(params: SignupParams): ErrorResponse | null {
  const { role, departmentId, sectionId } = params;

  if (!Object.values(Role).includes(role)) {
    logger.warn(`Invalid role provided: ${role}`);
    return { error: 'Invalid role provided.', status: HTTP_STATUS_BAD_REQUEST };
  }

  if ((role === 'STUDENT' || role === 'FACULTY') && !departmentId) {
    logger.warn(`Department ID is required for Student and Faculty roles.`);
    return { error: 'Department ID is required for Student and Faculty roles.', status: HTTP_STATUS_BAD_REQUEST };
  }

  return null;
}
