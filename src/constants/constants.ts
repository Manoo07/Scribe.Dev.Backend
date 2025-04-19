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
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HASH_ALGORITHM = 'sha256';
export const DIGEST_FORMAT = 'hex';
export const RANDOM_BYTES_LENGTH = 32;
export const RESET_URL = (token: string): string => `https://localhost:3000/reset-password?token=${token}`;
export const GMAIL_SERVICE = 'Gmail';
export const BCRYPT_SALT_ROUNDS = 10;
export const USER_NOT_FOUND_ERROR = 'User not found. Please sign up.';
export const JWT_EXPIRATION = '1h';
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const Roles = Object.freeze({
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  ADMIN: 'ADMIN',
  PRINCIPAL: 'PRINCIPAL',
});
