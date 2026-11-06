// Campus Events API
//
// Wiring only: middleware and routes. The logic lives in the layers.

import express from 'express';
import { sequelize } from './db/sequelize.mjs';
import { Event, Registration } from './models/index.mjs';
import { requestLogger } from './middleware/requestLogger.mjs';
import { notFound, errorHandler } from './middleware/errorHandler.mjs';
import { router } from './routes/index.mjs';

export { sequelize, Event, Registration };
export { seedDemoData } from './db/seed.mjs';

export const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/api', router);
app.use(notFound);
app.use(errorHandler);