import { Router } from 'express';
import AuthController from '@controllers/authController';

export const authRouter = Router();
const authController = new AuthController();

authRouter.post('/signup', authController.signup);
authRouter.post('/signin', authController.signin);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
