import {
  BCRYPT_SALT_ROUNDS,
  DIGEST_FORMAT,
  HASH_ALGORITHM,
  HTTP_STATUS_BAD_REQUEST,
  RANDOM_BYTES_LENGTH,
} from '@constants/constants';
import { SignupParams } from '@customTypes/user';
import CollegeDAO from '@dao/collegeDAO';
import DepartmentDAO from '@dao/departmentDAO';
import SectionDAO from '@dao/sectionDAO';
import { PrismaClient, Role } from '@prisma/client';
import { logger } from '@services/logService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ErrorResponse } from 'types/express';

const prisma = new PrismaClient();

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
  const { firstName, lastName, email, password, collegeId, role, departmentId } = params;
  const missing: string[] = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (!collegeId) missing.push('collegeId');
  if (!role) missing.push('role');
  if (!departmentId) missing.push('departmentId');

  return missing.length > 0 ? missing : null;
}

export async function validateSignupParams(params: SignupParams): Promise<ErrorResponse | null> {
  const { role, departmentId, sectionId, collegeId } = params;

  if (!Object.values(Role).includes(role)) {
    logger.warn(`Invalid role provided: ${role}`);
    return { error: 'Invalid role provided.', status: HTTP_STATUS_BAD_REQUEST };
  }
  const college = await CollegeDAO.findCollegeById(collegeId);
  if (!college) {
    logger.warn(`College ID does not exist: ${collegeId}`);
    return { error: 'College does not exist.', status: HTTP_STATUS_BAD_REQUEST };
  }

  if (role === Role.STUDENT || role === Role.FACULTY) {
    if (!departmentId) {
      logger.warn('Department ID is required for Student and Faculty roles.');
      return { error: 'Department ID is required.', status: HTTP_STATUS_BAD_REQUEST };
    }

    const department = await DepartmentDAO.getDepartmentById(departmentId);
    if (!department) {
      logger.warn(`Department ID does not exist: ${departmentId}`);
      return { error: 'Department does not exist.', status: HTTP_STATUS_BAD_REQUEST };
    }
  }

  if (role === 'STUDENT' && sectionId) {
    const section = await SectionDAO.getSectionById(sectionId);
    if (!section) {
      logger.warn(`Section ID does not exist: ${sectionId}`);
      return { error: 'Section does not exist.', status: HTTP_STATUS_BAD_REQUEST };
    }
  }

  return null;
}
