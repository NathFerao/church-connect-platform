import rateLimit from 'express-rate-limit';
import { config } from '../config/constants';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 1000 : 500, // Much higher in dev
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (config.nodeEnv === 'development') {
      const ip = req.ip || req.socket.remoteAddress;
      return ip === '::1' || ip === '127.0.0.1';
    }
    return false;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'development' ? 100 : 20, // Much higher in dev
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
  // Skip in development
  skip: (req) => {
    if (config.nodeEnv === 'development') {
      const ip = req.ip || req.socket.remoteAddress;
      return ip === '::1' || ip === '127.0.0.1';
    }
    return false;
  },
});