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
import { ErrorResponse, SignupResult } from 'types/express';
import { userRoleDAO } from '@dao/userRole';

class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async signup(params: SignupParams): Promise<SignupResult> {
    const { firstName, lastName, username, email, password, collegeId, role, departmentId, sectionId, specialization } =
      params;

    try {
      const validationError = await validateSignupParams(params);
      if (validationError) {
        logger.warn(validationError.error);
        return validationError;
      }

      logger.info(`[AuthService] Signing up user: ${email}`);

      let finalUsername = username;
      if (!finalUsername) {
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

      const existingUsers = await UserDAO.get({ filter: { username: finalUsername } });
      if (existingUsers) {
        return { error: 'Username already taken.', status: HTTP_STATUS_BAD_REQUEST };
      }

      const hashedPassword = await hashPassword(password);

      // Call refactored DAO method
      const newUser = await UserDAO.create({
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

      logger.info(`[AuthService] User ${email} successfully signed up.`);
      return newUser;
    } catch (err: any) {
      logger.error(`[AuthService] Error during signup for user ${email}: ${err.message}`);
      return this.handleSignupError(err);
    }
  }

  public async signin(email: string, password: string): Promise<{ token: string; role: string } | null> {
    const user = await UserDAO.get({ filter: { email } });

    if (user && (await comparePasswords(password, user.password))) {
      logger.info(`User ${email} successfully signed in.`);

      const userRole = await userRoleDAO.getUserRole(user.id);

      if (!userRole) {
        logger.warn(`[AuthService] Role not found for user ${email}`);
        throw new Error('Invalid email or password');
      }

      const role = userRole.role;
      const token = generateToken(user.id, role);
      await UserDAO.update({ id: user.id }, {
        activeToken: token,
      });


      return { token, role };
    }

    logger.warn(`Signin failed for user ${email}. Incorrect credentials.`);
    return null;
  }

  public async logout(userId: string): Promise<void> {
    await UserDAO.update({ id: userId }, {
      activeToken: null,
    });

    logger.info(`[AuthService] User ${userId} logged out.`);
  }



  public async forgotPassword(email: string): Promise<void> {
    const user = await UserDAO.get({ filter: { email }, select: { id: true } });

    if (!user) {
      logger.error(`User ${email} not found during password reset.`);
      throw new Error(USER_NOT_FOUND_ERROR);
    }

    const { token, hashed } = generateResetToken();
    await UserDAO.update(
      { email },
      { resetToken: hashed, resetTokenExpiry: BigInt(Date.now() + RESET_TOKEN_EXPIRY_TIME) }
    );

    await sendResetEmail(email, token);
    logger.info(`Password reset token sent to user ${email}.`);
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);
    const user = await UserDAO.get({ filter: { resetToken: hashedToken }, select: { id: true } });

    if (!user) {
      logger.error(`Invalid or expired token during password reset.`);
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await hashPassword(newPassword);
    if (!hashedPassword) {
      logger.error(`Failed to hash new password for user ${user.id}.`);
      throw new Error('Failed to reset password');
    }
    await UserDAO.update(
      { id: user.id },
      {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      }
    );

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
