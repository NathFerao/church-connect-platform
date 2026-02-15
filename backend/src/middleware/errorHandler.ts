import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction   // must stay in signature for Express
) => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json(
      errorResponse(err.message)
    );
  }

  logger.error(`Unexpected Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json(
    errorResponse('Internal server error')
  );
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json(
    errorResponse(`Route ${req.originalUrl} not found`)
  );
};