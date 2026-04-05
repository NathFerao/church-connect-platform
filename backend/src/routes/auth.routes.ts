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

// ─── Standard auth routes ─────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail(),
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
    body('email').isEmail(),
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
  [body('email').isEmail(), validate],
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

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect to Google — encode source + redirect_uri in the state param
// so they survive the round-trip through Google's servers.
router.get('/google', (req, res, next) => {
  const source = (req.query.source as string) || 'web';
  const redirectUri = (req.query.redirect_uri as string) || '';

  // Pack both values into the OAuth state so Google echoes them back
  const state = Buffer.from(JSON.stringify({ source, redirectUri })).toString('base64');

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  } as any)(req, res, next);
});

// Step 2: Google redirects here — unpack state to decide where to redirect
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=google_failed`,
  }),
  (req, res) => {
    const user = req.user as User;

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      churchId: user.churchId || '',
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret as jwt.Secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });

    // Decode the state param Google echoed back
    let source = 'web';
    let redirectUri = '';
    try {
      const raw = req.query.state as string;
      if (raw) {
        const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        source = parsed.source || 'web';
        redirectUri = parsed.redirectUri || '';
      }
    } catch {
      // If state is missing or malformed, fall back to web redirect
    }

    if (source === 'mobile') {
      const mobileRedirect = redirectUri || 'churchconnect://auth/callback';
      return res.redirect(`${mobileRedirect}?token=${token}`);
    }

    // Web redirect
    return res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  }
);

export default router;