import { AppError } from '../errors/AppError.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

async function getById(id) {
  const event = await eventRepository.findById(id);
  if (!event) {
    throw new AppError(404, 'NOT_FOUND', `Event with id ${id} not found`);
  }
  return event;
}

async function getWithCounts(id) {
  const event = await getById(id);
  const registered = await registrationRepository.countByEvent(id);
  return {
    ...event.toJSON(),
    registered,
    spotsLeft: Math.max(event.capacity - registered, 0)
  };
}

export const eventService = { getById, getWithCounts };