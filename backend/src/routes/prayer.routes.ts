import { Router } from 'express';
import { body } from 'express-validator';
import { PrayerController } from '../controllers/prayer.controller';
import { authenticate, requireChurch } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const prayerController = new PrayerController();

router.use(authenticate);
router.use(requireChurch);

router.get('/', prayerController.getAll);

router.post(
  '/',
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category').optional().isIn(['HEALTH', 'FAMILY', 'FINANCES', 'SPIRITUAL', 'RELATIONSHIPS', 'WORK', 'OTHER']),
    body('isAnonymous').optional().isBoolean(),
    body('isPrivate').optional().isBoolean(),
    validate,
  ],
  prayerController.create
);

router.put(
  '/:id',
  [validators.uuid('id'), validate],
  prayerController.update
);

router.patch(
  '/:id/answered',
  [validators.uuid('id'), validate],
  prayerController.markAnswered
);

router.post(
  '/:id/pray',
  [validators.uuid('id'), validate],
  prayerController.addPrayer
);

router.delete(
  '/:id/pray',
  [validators.uuid('id'), validate],
  prayerController.removePrayer
);

export default router;
