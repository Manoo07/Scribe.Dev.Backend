import { hashPassword } from './../utils/hashUtil';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { sendResetEmail } from '../utils/sendEmail';
import { generateResetToken } from '../utils/authUtil';
import crypto from "crypto";
import { RESET_TOKEN_EXPIRY_TIME } from '../constants';

const prisma = new PrismaClient();

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<any> => {
    const {
      name,
      email,
      password,
      collegeId,
      role,
      departmentId,
      sectionId,
      specialization,
    } = req.body;

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
          .status(result.status || 400)
          .json({ error: result.error, message: result.message });
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Signup Error:', error);

      if (error.message.includes('Invalid collegeId')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'An unknown error occurred' });
    }
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
      const token = await this.authService.signin(email, password);
      if (token) {
        const user=await prisma.user.findUnique({where:{email}});
        if(user)
        {
          await prisma.user.update(
            {
              where: {id: user.id},
          data: { lastLogin: new Date() },
            }
          )
        }
        res.status(200).json({ token});
       
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<any> => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({
        message: 'Reset Password link has been sent.',
      });
    }

    const { token, hashed } = generateResetToken();

    try {
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: hashed,
          resetTokenExpiry: new Date(RESET_TOKEN_EXPIRY_TIME), 
        },
      });

      await sendResetEmail(email, token);

      res.status(200).json({
        message: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const { token, newPassword } = req.body;

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashed,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Password has been reset successfully." });
  };
}

export default AuthController;
