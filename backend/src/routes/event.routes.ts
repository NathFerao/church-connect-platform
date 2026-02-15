import { Router } from 'express';
import { body } from 'express-validator';
import { EventController } from '../controllers/event.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const eventController = new EventController();

router.use(authenticate);

router.get('/', eventController.getAll);
router.get('/upcoming', eventController.getUpcoming);

router.get(
  '/:id',
  [validators.uuid('id'), validate],
  eventController.getById
);

router.post(
  '/',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('type').optional().isIn(['SERVICE', 'PRAYER_MEETING', 'BIBLE_STUDY', 'YOUTH_EVENT', 'CONFERENCE', 'WORKSHOP', 'OUTREACH', 'SOCIAL', 'OTHER']),
    body('startTime').isISO8601().toDate(),
    body('endTime').isISO8601().toDate(),
    validate,
  ],
  eventController.create
);

router.put(
  '/:id',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [validators.uuid('id'), validate],
  eventController.update
);

router.delete(
  '/:id',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [validators.uuid('id'), validate],
  eventController.delete
);

router.post(
  '/:id/register',
  [validators.uuid('id'), validate],
  eventController.register
);

router.delete(
  '/:id/register',
  [validators.uuid('id'), validate],
  eventController.unregister
);

export default router;
