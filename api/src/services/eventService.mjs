import { AppError } from '../errors/AppError.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

function eventNotFound(id) {
  return new AppError(404, 'NOT_FOUND', `Event with id ${id} not found`);
}

async function list() {
  return eventRepository.findAllOrderedByStart();
}

async function getById(id) {
  const event = await eventRepository.findById(id);
  if (!event) {
    throw eventNotFound(id);
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

async function create(data) {
  return eventRepository.create(data);
}

async function update(id, data) {
  const event = await getById(id);
  return eventRepository.update(event, data);
}

async function remove(id) {
  const deleted = await eventRepository.deleteById(id);
  if (deleted === 0) {
    throw eventNotFound(id);
  }
}

export const eventService = { list, getById, getWithCounts, create, update, remove };