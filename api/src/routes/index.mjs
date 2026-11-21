import { Router } from 'express';
import { eventsRouter } from './events.mjs';
import { healthController } from '../controllers/healthController.mjs';
import { statsController } from '../controllers/statsController.mjs';
import { notificationController } from '../controllers/notificationController.mjs';
import { mcpController } from '../controllers/mcpController.mjs';

export const router = Router();

router.get('/health', healthController.check);
router.use('/events', eventsRouter);
router.get('/stats', statsController.get);
router.get('/notifications/stream', notificationController.stream);
router.post('/mcp', mcpController.handle);
router.get('/mcp', mcpController.methodNotAllowed);
router.delete('/mcp', mcpController.methodNotAllowed);