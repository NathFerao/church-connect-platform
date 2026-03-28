import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/profile', userController.getProfile);

// Update current user's profile
router.put(
  '/profile',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('currentPassword').optional().isString(),
    body('newPassword').optional().isLength({ min: 8 }),
    validate,
  ],
  userController.updateProfile
);

// Get all members in current user's church
router.get('/church-members', userController.getChurchMembers);

// Create a new member (church admin only)
router.post(
  '/create-member',
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['MEMBER', 'LEADER', 'PASTOR', 'CHURCH_ADMIN']),
    validate,
  ],
  userController.createMember
);

// Update member status (activate/deactivate)
router.patch(
  '/:id/status',
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  [
    validators.uuid('id'),
    body('isActive').isBoolean(),
    validate,
  ],
  userController.updateMemberStatus
);

// Update member role
router.patch(
  '/:id/role',
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  [
    validators.uuid('id'),
    body('role').isIn(['MEMBER', 'LEADER', 'PASTOR', 'CHURCH_ADMIN']),
    validate,
  ],
  userController.updateMemberRole
);

router.post(
  '/assign-to-church',
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  [
    body('email').isEmail(),
    body('role')
      .optional()
      .isIn(['MEMBER', 'LEADER', 'PASTOR', 'CHURCH_ADMIN'])
      .withMessage('Invalid role'),
    validate,
  ],
  userController.assignToChurch
);

// Get unassigned users (super admin only)
router.get(
  '/unassigned',
  authorize('SUPER_ADMIN'),
  userController.getUnassignedUsers
);

export default router;