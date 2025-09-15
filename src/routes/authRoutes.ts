import AuthController from '@controllers/authController';
import { authMiddleware } from '@middleware/authMiddleware';
import { Router } from 'express';

export const authRouter = Router();
const authController = new AuthController();

authRouter.post('/signup', authController.signup);
authRouter.post('/signin', authController.signin);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/logout', authMiddleware, authController.logout);

// GET /api/v1/auth/me
authRouter.get('/me', authMiddleware, authController.me);
