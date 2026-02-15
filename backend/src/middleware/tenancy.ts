import { Request, Response, NextFunction } from 'express';
import { BadRequestError, ForbiddenError } from '../utils/errors';

export const ensureSameChurch = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const resourceChurchId = req.params.churchId || req.body.churchId;

  if (!resourceChurchId) {
    return next(new BadRequestError('Church ID is required'));
  }

  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  if (resourceChurchId !== req.churchId) {
    return next(
      new ForbiddenError('You can only access resources from your own church')
    );
  }

  next();
};

export const churchContext = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.churchId) {
    return next(new BadRequestError('Church context is required'));
  }
  next();
};