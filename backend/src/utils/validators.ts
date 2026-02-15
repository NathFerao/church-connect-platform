import { body, param, query, ValidationChain } from 'express-validator';

export const validators = {
  email: () => body('email').isEmail().normalizeEmail(),
  
  password: () =>
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  
  uuid: (field: string) =>
    param(field).isUUID().withMessage(`${field} must be a valid UUID`),
  
  pagination: (): ValidationChain[] => [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
};