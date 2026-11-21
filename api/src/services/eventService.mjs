import { AppError } from '../errors/AppError.mjs';
import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';
import { eventBus, BusEvents } from '../bus/eventBus.mjs';

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
  const event = await eventRepository.create(data);
  eventBus.emit(BusEvents.EVENT_CREATED, { id: event.id, title: event.title });
  return event;
}

async function update(id, data) {
  const event = await getById(id);
  return eventRepository.update(event, data);
}

async function listWithCounts(when) {
  const events = await eventRepository.findAllOrderedByStart();
  const now = new Date();
  const selected = events.filter((event) => {
    const isPast = new Date(event.startsAt) < now;
    return when === 'past' ? isPast : !isPast;
  });
  return Promise.all(selected.map((event) => getWithCounts(event.id)));
}

async function remove(id) {
  const deleted = await eventRepository.deleteById(id);
  if (deleted === 0) {
    throw eventNotFound(id);
  }
}

export const eventService = { list, getById, getWithCounts, listWithCounts, create, update, remove };