import { Router } from 'express';
import { eventsRouter } from './events.mjs';
import { healthController } from '../controllers/healthController.mjs';
import { statsController } from '../controllers/statsController.mjs';
import { notificationController } from '../controllers/notificationController.mjs';

export const router = Router();

router.get('/health', healthController.check);
router.use('/events', eventsRouter);
router.get('/stats', statsController.get);
router.get('/notifications/stream', notificationController.stream);