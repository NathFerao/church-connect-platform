import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/helpers';

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {                                   // ← explicit void return type
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? (err as any).path : undefined,
      message: err.msg,
    }));

    res.status(400).json(
      errorResponse('Validation failed', errorMessages)
    );
    return;                                    // ← explicit return, no value
  }

  next();                                      // ← falls through here cleanly
};