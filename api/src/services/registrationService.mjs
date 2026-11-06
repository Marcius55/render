import { AppError } from '../errors/AppError.mjs';
import { logger } from '../config/logger.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';
import { eventService } from './eventService.mjs';

async function listForEvent(eventId) {
  const event = await eventService.getById(eventId);
  return registrationRepository.findAllByEvent(event.id);
}

async function register(eventId, { name, email }) {
  const event = await eventService.getById(eventId);

  const existing = await registrationRepository.findByEventAndEmail(event.id, email);
  if (existing) {
    throw new AppError(409, 'CONFLICT', `${email} is already registered for this event`);
  }

  const count = await registrationRepository.countByEvent(event.id);
  if (count >= event.capacity) {
    throw new AppError(409, 'CONFLICT', 'Event is full');
  }

  const registration = await registrationRepository.create({ eventId: event.id, name, email });
  logger.info('new registration for ' + event.title + ': ' + name + ' <' + email + '>');

  // TODO send a confirmation mail

  return registration;
}

export const registrationService = { listForEvent, register };