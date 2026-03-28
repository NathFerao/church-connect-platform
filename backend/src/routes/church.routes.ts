import { Router } from 'express';
import { body } from 'express-validator';
import { ChurchController } from '../controllers/church.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const churchController = new ChurchController();

// Public route - no auth needed (for church registration page)
router.post(
  '/register',
  [
    body('name').notEmpty().trim(),
    body('adminEmail').isEmail(),
    body('adminPassword').isLength({ min: 8 }),
    body('adminFirstName').notEmpty().trim(),
    body('adminLastName').notEmpty().trim(),
    validate,
  ],
  churchController.create
);

// All routes below require authentication
router.use(authenticate);

// Current church settings (any authenticated user can view their church)
router.get('/settings', churchController.getCurrentSettings);

// Update current church settings (only church admin)
router.put(
  '/settings',
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  [
    body('name').optional().trim(),
    body('email').optional().isEmail(),
    body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i),  // Hex color
    body('secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i),
    validate,
  ],
  churchController.updateCurrentSettings
);

// Super admin routes - manage all churches
router.get(
  '/',
  authorize('SUPER_ADMIN'),  // Only super admin
  churchController.getAll
);

router.get(
  '/:id',
  authorize('SUPER_ADMIN'),
  [validators.uuid('id'), validate],
  churchController.getById
);

router.put(
  '/:id',
  authorize('SUPER_ADMIN'),
  [validators.uuid('id'), validate],
  churchController.update
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  [validators.uuid('id'), validate],
  churchController.delete
);

export default router;
