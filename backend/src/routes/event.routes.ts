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

router.get('/:id', [validators.uuid('id'), validate], eventController.getById);

router.post(
  '/',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('type').optional().isIn(['SERVICE','PRAYER_MEETING','BIBLE_STUDY','YOUTH_EVENT','CONFERENCE','WORKSHOP','OUTREACH','SOCIAL','OTHER']),
    body('startTime').isISO8601().toDate(),
    body('endTime').isISO8601().toDate(),
    body('recurrence.type').optional().isIn(['weekly', 'custom']),
    body('recurrence.weekDays').optional().isArray(),
    body('recurrence.weeksCount').optional().isInt({ min: 1, max: 52 }),
    body('recurrence.customDates').optional().isArray(),
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

// IMPORTANT: /series/:groupId must come BEFORE /:id or Express
// will try to match the string "series" as an :id param
router.delete(
  '/series/:groupId',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  eventController.deleteSeries
);

router.delete(
  '/:id',
  authorize('CHURCH_ADMIN', 'PASTOR', 'LEADER'),
  [validators.uuid('id'), validate],
  eventController.delete
);

router.post('/:id/register', [validators.id('id'), validate], eventController.register);
router.delete('/:id/register', [validators.id('id'), validate], eventController.unregister);

export default router;