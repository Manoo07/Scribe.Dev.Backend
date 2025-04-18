import { hashPassword } from './../utils/hashUtil';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { sendResetEmail } from '../services/emailService';
import { generateResetToken } from '../utils/authUtil';
import crypto from 'crypto';
import { DIGEST_FORMAT, HASH_ALGORITHM, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_OK, HTTP_STATUS_UNAUTHORIZED, RESET_TOKEN_EXPIRY_TIME } from '../constants/constants';
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
        return res.status(result.status || HTTP_STATUS_BAD_REQUEST).json({ error: result.error, message: result.message });
      }

      return res.status(HTTP_STATUS_CREATED).json(result);
    } catch (error: any) {
      console.error('Signup Error:', error);

      if (error.message.includes('Invalid collegeId')) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({ error: error.message });
      }

      return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR ).json({ error: 'An unknown error occurred' });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
      const token = await this.authService.signin(email, password);
      if (token) {

        res.status(HTTP_STATUS_OK ).json({ token });
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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(HTTP_STATUS_OK).json({
        message: 'Reset Password link has been sent.',
      });
    }

    const { token, hashed } = generateResetToken();

    try {
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: hashed,
          resetTokenExpiry: new Date(Date.now()+RESET_TOKEN_EXPIRY_TIME),
        },
      });

      await sendResetEmail(email, token);

      res.status(HTTP_STATUS_OK).json({
        message: 'A password reset link has been sent.',
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR ).json({ error: 'Internal Server Error' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const { token, newPassword } = req.body;

    const hashed = crypto.createHash(HASH_ALGORITHM).update(token).digest(DIGEST_FORMAT);

    const user = await UserDAO.findByResetToken(hashed);


    if (!user) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await UserDAO.updatePasswordAndClearToken(user.id, hashedPassword);

    res.json({ message: 'Password has been reset successfully.' });
  };
}

export default AuthController;
