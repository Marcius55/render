import { eventRepository } from '../repositories/eventRepository.mjs';
import { registrationRepository } from '../repositories/registrationRepository.mjs';

function getOccupancy(event, registered) {
  const pct = event.capacity > 0 ? Math.round((registered / event.capacity) * 100) : 0;
  return pct + '%';
}

function getStatus(event, registered) {
  if (registered >= event.capacity) {
    return 'full';
  }
  if (new Date(event.startsAt) < new Date()) {
    return 'past';
  }
  return 'open';
}

async function getStats() {
  const events = await eventRepository.findAll();
  const result = [];

  for (const event of events) {
    const registered = await registrationRepository.countByEvent(event.id);
    result.push({
      id: event.id,
      title: event.title,
      registered,
      capacity: event.capacity,
      occupancy: getOccupancy(event, registered),
      status: getStatus(event, registered)
    });
  }

  return result;
}

export const statsService = { getStats };