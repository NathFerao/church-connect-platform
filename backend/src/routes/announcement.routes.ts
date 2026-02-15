import { Router } from 'express';
import { body } from 'express-validator';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const announcementController = new AnnouncementController();

router.use(authenticate);

router.get('/', announcementController.getAll);

router.get(
  '/:id',
  [validators.uuid('id'), validate],
  announcementController.getById
);

router.post(
  '/',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [
    body('title').notEmpty().trim(),
    body('content').notEmpty().trim(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('isPublished').optional().isBoolean(),
    validate,
  ],
  announcementController.create
);

router.put(
  '/:id',
  [validators.uuid('id'), validate],
  announcementController.update
);

router.delete(
  '/:id',
  [validators.uuid('id'), validate],
  announcementController.delete
);

export default router;