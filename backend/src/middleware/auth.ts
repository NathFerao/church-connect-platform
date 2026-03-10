import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants';
import prisma from '../config/database';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { JwtPayload } from '../types';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { church: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid token or inactive user');
    }

    // Assign the full Prisma user object directly —
    // no need to pick fields manually.
    req.user = user;
    req.churchId = user.churchId || '';
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

export const requireChurch = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Not authenticated'));
  }

  if (!req.user.churchId) {
    return next(
      new ForbiddenError('You must be assigned to a church to access this resource')
    );
  }

  next();
};