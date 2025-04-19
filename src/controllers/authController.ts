import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import AuthService from '../services/authService';

import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
} from '../constants/constants';
import UserDAO from '../dao/UserDAO';


const prisma = new PrismaClient();

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password, collegeId, role, departmentId, sectionId, specialization } = req.body;

    try {
      const result = await this.authService.signup({
        name,
        email,
        password,
        collegeId,
        role,
        departmentId,
        sectionId,
        specialization,
      });

      if (result.error) {
        return res
          .status(result.status || HTTP_STATUS_BAD_REQUEST)
          .json({ error: result.error, message: result.message });
      }

      return res.status(HTTP_STATUS_CREATED).json(result);
    } catch (error: any) {
      console.error('Signup Error:', error);

      if (error.message.includes('Invalid collegeId')) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.message });
      }

      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'An unknown error occurred' });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
      const token = await this.authService.signin(email, password);
      if (token) {
        res.status(HTTP_STATUS_OK).json({ token });
        const user = await UserDAO.findByEmail(email);
        if (user) {
          await UserDAO.updateLastLogin(user.id);
        }
        res.status(HTTP_STATUS_OK).json({ token });
      } else {
        res.status(HTTP_STATUS_UNAUTHORIZED).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.message });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS_NOT_FOUND).json({
        message: 'Email is required',
      });
    }
  
    try {
      await this.authService.forgotPassword(email);
      res.status(HTTP_STATUS_OK).json({
        message: 'A password reset link has been sent.',
      });
    } catch (error: any) {
      if (error.message === 'User not found. Please sign up.') {
        return res.status(HTTP_STATUS_NOT_FOUND).json({ error: error.message });
      }
  
      console.error('Error in forgotPassword:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const { token, newPassword } = req.body;
    try {
      await this.authService.resetPassword(token, newPassword);
      res.status(HTTP_STATUS_OK).json({
        message: 'Password has been reset successfully.',
      });
    } catch (error: any) {
      res.status(HTTP_STATUS_BAD_REQUEST).json({
        message: error.message || 'Failed to reset password',
      });
    }
  };
}

export default AuthController;
