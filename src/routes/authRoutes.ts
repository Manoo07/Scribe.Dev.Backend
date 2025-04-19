import { Router } from 'express';
import AuthController from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/forget-password', authController.forgetPassword);
export default router;
