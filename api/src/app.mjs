import express from 'express';
import { z } from 'zod';
import { logger } from './config/logger.mjs';
import { sequelize } from './db/sequelize.mjs';
import { Event, Registration } from './models/index.mjs';
import { eventRepository } from './repositories/eventRepository.mjs';
import { registrationRepository } from './repositories/registrationRepository.mjs';
import { AppError } from './errors/AppError.mjs';
import { eventService } from './services/eventService.mjs';

// The tests import these from app.mjs, so keep re-exporting them.
export { sequelize, Event, Registration };
export { seedDemoData } from './db/seed.mjs';

// ---------------------------------------------------------------- validation

const idSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Messages are shown to end users in the frontend, so keep them human.
const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters').max(120, 'Use at most 120 characters'),
  description: z.string().trim().max(2000, 'Use at most 2000 characters').optional(),
  location: z.string().trim().min(2, 'Enter a location').max(120, 'Use at most 120 characters'),
  startsAt: z.coerce.date({ error: 'Pick a date and time' }),
  capacity: z.number({ error: 'Enter a number of seats' }).int('Use a whole number').min(1, 'At least 1 seat').max(10000, 'At most 10 000 seats')
});

const updateEventSchema = createEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters)').max(100, 'Use at most 100 characters'),
  email: z.email('Enter a valid email address').toLowerCase()
});

// ---------------------------------------------------------------- app

export const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - start)
    });
  });
  next();
});

app.get('/api/health', async (req, res) => {
  await sequelize.authenticate();
  res.status(200).json({ status: 'ok' });
});

app.get('/api/events', async (req, res) => {
  res.json(await eventService.list());
});

app.get('/api/events/:id', async (req, res) => {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: p.error.issues.map((i) => ({ field: i.path.join('.') || 'params', message: i.message }))
      }
    });
  }

  res.status(200).json(await eventService.getWithCounts(p.data.id));
});

app.post('/api/events', async (req, res) => {
  const result = createEventSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: result.error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }))
      }
    });
  }

  const event = await eventService.create(result.data);
  res.status(201).location('/api/events/' + event.id).json(event);
});

app.patch('/api/events/:id', async (req, res) => {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: p.error.issues.map((i) => ({ field: i.path.join('.') || 'params', message: i.message }))
      }
    });
  }
  const b = updateEventSchema.safeParse(req.body);
  if (!b.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: b.error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }))
      }
    });
  }

  res.status(200).json(await eventService.update(p.data.id, b.data));
});

app.delete('/api/events/:id', async (req, res) => {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: p.error.issues.map((i) => ({ field: i.path.join('.') || 'params', message: i.message }))
      }
    });
  }

  await eventService.remove(p.data.id);
  res.status(204).send();
});

app.get('/api/events/:id/registrations', async (req, res) => {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: p.error.issues.map((i) => ({ field: i.path.join('.') || 'params', message: i.message }))
      }
    });
  }

  const ev = await eventRepository.findById(p.data.id);
  if (!ev) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Event with id ${p.data.id} not found` } });
  }
  const registrations = await registrationRepository.findAllByEvent(ev.id);
  res.json(registrations);
});

app.post('/api/events/:id/registrations', async (req, res, next) => {
  try {
    const p = idSchema.safeParse(req.params);
    if (!p.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: p.error.issues.map((i) => ({ field: i.path.join('.') || 'params', message: i.message }))
        }
      });
    }
    const data = registrationSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: data.error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }))
        }
      });
    }

    const ev = await eventRepository.findById(p.data.id);
    if (ev) {
      const existing = await registrationRepository.findByEventAndEmail(ev.id, data.data.email);
      if (!existing) {
        
        const count = await registrationRepository.countByEvent(ev.id);
        if (count > ev.capacity) {
          return res.status(409).json({ error: { code: 'CONFLICT', message: 'Event is full' } });
        }

        const reg = await registrationRepository.create({ eventId: ev.id, name: data.data.name, email: data.data.email });
        logger.info('new registration for ' + ev.title + ': ' + data.data.name + ' <' + data.data.email + '>');

        return res.status(201).json(reg);
      } else {
        return res.status(409).json({ error: { code: 'CONFLICT', message: `${data.data.email} is already registered for this event` } });
      }
    } else {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Event with id ${p.data.id} not found` } });
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/stats', async (req, res) => {
  const events = await eventRepository.findAll();
  const result = [];
  for (let i = 0; i < events.length; i++) {
    const regs = await registrationRepository.findAllByEvent(events[i].id);
    let pct = 0;
    if (events[i].capacity > 0) {
      pct = Math.round((regs.length / events[i].capacity) * 100);
    }
    let status = 'open';
    if (regs.length >= events[i].capacity) {
      status = 'full';
    } else if (new Date(events[i].startsAt) < new Date()) {
      status = 'past';
    }
    result.push({
      id: events[i].id,
      title: events[i].title,
      registered: regs.length,
      capacity: events[i].capacity,
      occupancy: pct + '%',
      status: status
    });
  }
  res.json(result);
});

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } });
});

app.use((err, req, res, _next) => {
  if (err instanceof AppError) {
    const body = { code: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json({ error: body });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
  }
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});