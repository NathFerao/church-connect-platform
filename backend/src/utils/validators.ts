import { body, param, query, ValidationChain } from 'express-validator';

export const validators = {
  email: () => body('email').isEmail(),
  
  password: () =>
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  
  uuid: (field: string) =>
    param(field)
      .isUUID() // This should work, but let's make it explicit
      .withMessage(`${field} must be a valid UUID`),
  
  // ✅ Add a more lenient ID validator for cases where UUID validation is too strict
  id: (field: string = 'id') =>
    param(field)
      .trim()
      .notEmpty()
      .withMessage(`${field} is required`)
      .isLength({ min: 36, max: 36 }) // UUID length
      .withMessage(`${field} must be a valid ID`),
  
  pagination: (): ValidationChain[] => [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
};