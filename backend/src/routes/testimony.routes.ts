import { Router } from 'express';
import { body } from 'express-validator';
import { TestimonyController } from '../controllers/testimony.controller';
import { authenticate, requireChurch } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { validators } from '../utils/validators';

const router = Router();
const testimonyController = new TestimonyController();

router.use(authenticate);
router.use(requireChurch);

router.get('/', testimonyController.getAll);
router.get('/featured', testimonyController.getFeatured);

router.get(
  '/:id',
  [validators.uuid('id'), validate],
  testimonyController.getById
);

router.post(
  '/',
  [
    body('title').notEmpty().trim(),
    body('content').notEmpty().trim(),
    body('category').optional().isIn(['HEALING', 'SALVATION', 'PROVISION', 'DELIVERANCE', 'ANSWERED_PRAYER', 'LIFE_CHANGE', 'OTHER']),
    body('isPublished').optional().isBoolean(),
    validate,
  ],
  testimonyController.create
);

router.put(
  '/:id',
  [validators.uuid('id'), validate],
  testimonyController.update
);

router.delete(
  '/:id',
  [validators.uuid('id'), validate],
  testimonyController.delete
);

export default router;