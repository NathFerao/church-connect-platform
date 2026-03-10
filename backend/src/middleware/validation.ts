import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/helpers';

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // ✅ Add logging to see what's failing
    console.log('Validation failed for:', req.method, req.path);
    console.log('Params:', req.params);
    console.log('Errors:', errors.array());
    
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? (err as any).path : undefined,
      message: err.msg,
    }));

    res.status(400).json(
      errorResponse('Validation failed', errorMessages)
    );
    return;
  }

  next();
};