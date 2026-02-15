import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('churchId').isUUID(),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  authController.login
);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate,
  ],
  authController.changePassword
);

router.get('/profile', authenticate, authController.getProfile);

export default router;