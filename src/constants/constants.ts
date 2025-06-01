export const BASE_URL = '/api/v1';
export const LOG_LEVEL = 'info';
export const LOG_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSSZZ';
export const RESET_TOKEN_EXPIRY_TIME = 15 * 60 * 1000;
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const PRISMA_RECORD_NOT_FOUND = 'P2025';
export const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
export const HASH_ALGORITHM = 'sha256';
export const DIGEST_FORMAT = 'hex';
export const RANDOM_BYTES_LENGTH = 32;
export const UI_BASE_URL = process.env.UI_BASE_URL || 'http://localhost:5173';
export const RESET_URL = (token: string): string => `${UI_BASE_URL}/reset-password?token=${token}`;
export const GMAIL_SERVICE = 'Gmail';
export const BCRYPT_SALT_ROUNDS = 10;
export const USER_NOT_FOUND_ERROR = 'User not found. Please sign up.';
export const USER_NAME_REGEX_PATTERN = /^[A-Za-z]+(?: [A-Za-z])?$/;
export const ALPHABETIC_ONLY_REGEX = /^[a-zA-Z]+$/;
export const JWT_EXPIRATION = '12h';
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const Roles = Object.freeze({
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  ADMIN: 'ADMIN',
  PRINCIPAL: 'PRINCIPAL',
});
export const ALLOWED_FILTER_KEYS = new Set([
  'id',
  'name',
  'facultyId',
  'sectionId',
  'syllabusUrl',
  'createdAt',
  'updatedAt',
  'AND',
  'OR',
  'NOT',
]);

