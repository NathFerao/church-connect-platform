import { Router } from 'express';
import authRoutes from './auth.routes';
import announcementRoutes from './announcement.routes';
import prayerRoutes from './prayer.routes';
import testimonyRoutes from './testimony.routes';
import eventRoutes from './event.routes';
import churchRoutes from './church.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/churches', churchRoutes);
router.use('/announcements', announcementRoutes);
router.use('/prayers', prayerRoutes);
router.use('/testimonies', testimonyRoutes);
router.use('/events', eventRoutes);
router.use('/upload', uploadRoutes);

export default router;