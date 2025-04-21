import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { logger } from '../services/logService';
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  PRISMA_UNIQUE_CONSTRAINT_VIOLATION,
  USER_NOT_FOUND_ERROR,
} from '../constants/constants';
import UserDAO from '../dao/UserDAO';
import { generateUsername } from '../utils/userUtils';

const prisma = new PrismaClient();

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<any> => {
    const { firstName, lastName, username, email, password, collegeId, role, departmentId, sectionId, specialization } =
      req.body;

    logger.info('[AuthController] Signup request received for email:', email);

    try {
      const newUsername = generateUsername(username, firstName, lastName);
      const result = await this.authService.signup({
        firstName,
        lastName,
        username: newUsername,
        email,
        password,
        collegeId,
        role,
        departmentId,
        sectionId,
        specialization,
      });

      if (result.error) {
        logger.error('[AuthController] Signup failed:', result.error);
        return res
          .status(result.status || HTTP_STATUS_BAD_REQUEST)
          .json({ error: result.error, message: result.message });
      }

      logger.info('[AuthController] Signup successful for email:', email);
      return res.status(HTTP_STATUS_CREATED).json(result);
    } catch (error: any) {
      logger.error('[AuthController] Signup error:', error);

      if (error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION && error.meta?.target?.includes('username'))
        return res.status(HTTP_STATUS_CONFLICT).json({ error: 'Username already taken' });

      if (error.message.includes('Invalid collegeId')) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.message });
      }

      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'An unknown error occurred' });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    logger.info('[AuthController] Signin request received for email:', email);

    try {
      const token = await this.authService.signin(email, password);

      if (token) {
        logger.info('[AuthController] Signin successful for email:', email);
        res.status(HTTP_STATUS_OK).json({ token });

        const user = await UserDAO.findByEmail(email);
        if (user) {
          await UserDAO.updateLastLogin(user.id);
        }
      } else {
        logger.warn('[AuthController] Invalid credentials for email:', email);
        res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      logger.error('[AuthController] Signin error for email:', email, error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.message });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;

    logger.info('[AuthController] Forgot password request received for email:', email);

    if (!email) {
      logger.warn('[AuthController] Email is missing in forgot password request');
      return res.status(HTTP_STATUS_NOT_FOUND).json({
        message: 'Email is required',
      });
    }

    try {
      await this.authService.forgotPassword(email);
      logger.info('[AuthController] Forgot password request processed successfully for email:', email);
      res.status(HTTP_STATUS_OK).json({
        message: 'A password reset link has been sent.',
      });
    } catch (error: any) {
      if (error.message === USER_NOT_FOUND_ERROR) {
        logger.error('[AuthController] User not found for email:', email);
        return res.status(HTTP_STATUS_NOT_FOUND).json({ error: error.message });
      }

      logger.error('[AuthController] Forgot password error for email:', email, error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const token = req.query.token as string;
    const { newPassword } = req.body;

    logger.info('[AuthController] Reset password request received for token:', token);

    if (!token || !newPassword) {
      logger.warn('[AuthController] Missing token or new password in reset password request');
      return res.status(HTTP_STATUS_BAD_REQUEST).json({
        message: 'Token and new password are required.',
      });
    }

    try {
      await this.authService.resetPassword(token, newPassword);
      logger.info('[AuthController] Password reset successfully for token:', token);
      res.status(HTTP_STATUS_OK).json({
        message: 'Password has been reset successfully.',
      });
    } catch (error: any) {
      logger.error('[AuthController] Reset password error for token:', token, error);
      res.status(HTTP_STATUS_BAD_REQUEST).json({
        message: error.message || 'Failed to reset password',
      });
    }
  };
}

export default AuthController;
