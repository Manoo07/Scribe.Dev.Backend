import { PrismaClient, Role } from '@prisma/client';
import { comparePasswords, hashPassword } from '@utils/hashUtil';
import { generateToken } from '@utils/jwtUtil';
import {
  DIGEST_FORMAT,
  HASH_ALGORITHM,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  PRISMA_RECORD_NOT_FOUND,
  PRISMA_UNIQUE_CONSTRAINT_VIOLATION,
  RESET_TOKEN_EXPIRY_TIME,
  Roles,
  USER_NAME_REGEX_PATTERN,
  USER_NOT_FOUND_ERROR,
} from '@constants/constants';
import UserDAO from '@dao/userDAO';
import { generateResetToken, validateSignupParams } from '@utils/authUtil';
import { sendResetEmail } from '@services/emailService';
import crypto from 'crypto';
import { logger } from '@services/logService';
import { generateUsername } from '@utils/userUtils';
import { SignupParams } from '@customTypes/user';

export interface ErrorResponse {
  error: string;
  status: number;
}

type SignupResult = any | ErrorResponse;

class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async signup(params: SignupParams): Promise<SignupResult> {
    const { firstName, lastName, username, email, password, collegeId, role, departmentId, sectionId, specialization } =
      params;

    try {
      const validationError = validateSignupParams(params);
      if (validationError) {
        logger.warn(validationError.error);
        return validationError;
      }

      logger.info(`[AuthService] Signing up user: ${email}`);
      let finalUsername = username;
      if (!username) {
        finalUsername = generateUsername(username, firstName, lastName);
      } else {
        const usernameRegex = new RegExp(USER_NAME_REGEX_PATTERN);
        if (!usernameRegex.test(username)) {
          return {
            error: 'Username must contain only alphabetic characters (a-z, A-Z)',
            status: HTTP_STATUS_BAD_REQUEST,
          };
        }
      }

      const existingUserWithUsername = await UserDAO.findByUsername(finalUsername);

      if (existingUserWithUsername) {
        return { error: 'Username already taken.', status: HTTP_STATUS_BAD_REQUEST };
      }

      const hashedPassword = await hashPassword(password);

      // Create a user
      const result = await UserDAO.createUser({
        firstName,
        lastName,
        username: finalUsername,
        email,
        password: hashedPassword,
        collegeId,
        role,
        departmentId,
        sectionId,
        specialization,
      });

      logger.info(`User ${email} successfully signed up.`);
      return result;
    } catch (err: any) {
      logger.error(`Error during signup for user ${email}: ${err.message}`);
      logger.error('Error during signup:', err);
      return this.handleSignupError(err);
    }
  }

  public async signin(email: string, password: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await comparePasswords(password, user.password))) {
      logger.info(`User ${email} successfully signed in.`);

      const userRole=await UserDAO.getUserRole(user.id);
      if(!userRole)
      {
        logger.warn("Role not found for the user ${email}");
        return null;
      }
      // db call from userRole
      // move tbis to DAO dont call dirctly
      // const userRole = DAO.getRole(user.id);
      // pass this userRole to the generate token fun
      return generateToken(user.id,userRole);
    }

    logger.warn(`Signin failed for user ${email}. Incorrect credentials.`);
    return null;
  }

  public async forgotPassword(email: string): Promise<void> {
    const user = await UserDAO.findByEmail(email);

    if (!user) {
      logger.error(`User ${email} not found during password reset.`);
      throw new Error(USER_NOT_FOUND_ERROR);
    }

    const { token, hashed } = generateResetToken();
    await UserDAO.updateResetToken(email, hashed, RESET_TOKEN_EXPIRY_TIME);
    await sendResetEmail(email, token);
    logger.info(`Password reset token sent to user ${email}.`);
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
    const user = await UserDAO.findByResetToken(hashed);

    if (!user) {
      logger.error(`Invalid or expired token during password reset.`);
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserDAO.updatePasswordAndClearToken(user.id, hashedPassword);
    logger.info(`User ${user.email} successfully reset their password.`);
  }

  // -------------------- Helper Functions --------------------

  private handleSignupError(error: any): ErrorResponse {
    if (error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION) {
      logger.warn('Email address is already in use.');
      return { error: 'Email address is already in use.', status: HTTP_STATUS_CONFLICT };
    } else if (error.code === PRISMA_RECORD_NOT_FOUND || error.message === 'College Not found') {
      logger.warn('Invalid College, Department, or Section ID.');

      return { error: 'Invalid College, Department, or Section ID.', status: HTTP_STATUS_BAD_REQUEST };
    } else if (error.message === 'Specialization is required for faculty.') {
      logger.warn('Specialization is required for faculty.');
      return { error: error.message, status: HTTP_STATUS_BAD_REQUEST };
    } else {
      logger.error(`Failed to create user: ${error.message}`);
      return { error: 'Failed to create user.', status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
    }
  }
}
export default AuthService;
