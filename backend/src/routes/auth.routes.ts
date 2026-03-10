import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';
import { JwtPayload } from '../types';
import { User } from '@prisma/client';

const router = Router();
const authController = new AuthController();

// ─── Existing routes (unchanged) ─────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
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

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail(), validate],
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().trim(),
    body('newPassword').isLength({ min: 8 }),
    validate,
  ],
  authController.resetPassword
);

// ─── Google OAuth routes (NEW) ────────────────────────────────────────────────

// Step 1: Redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Step 2: Google redirects back here with the code
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=google_failed`,
  }),
  (req, res) => {
    const user = req.user as User;

    // Issue the same JWT as regular login
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      churchId: user.churchId || '',
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
    
    const isMobile = req.query.source === 'mobile';
    const redirectBase = isMobile
      ? (req.query.redirect_uri as string) ?? 'churchconnect://auth/callback'
      : `${process.env.FRONTEND_URL}/auth/callback`;
    res.redirect(`${redirectBase}?token=${token}`);
        // Redirect to frontend callback page with token in query param
        // The frontend /auth/callback page will read this and set up the store
        res.redirect(
          `${config.frontendUrl}/auth/callback?token=${token}`
        );
  }
);

export default router;