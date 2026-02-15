
import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
const uploadController = new UploadController();

// POST /upload/logo - Upload church logo (Church Admin only)
router.post(
  '/logo',
  authenticate,
  authorize('CHURCH_ADMIN', 'SUPER_ADMIN'),
  upload.single('logo'),  // Expects form field named 'logo'
  uploadController.uploadLogo
);

export default router;