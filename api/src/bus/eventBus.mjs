import { EventEmitter } from 'node:events';

export const BusEvents = {
  EVENT_CREATED: 'event.created',
  REGISTRATION_CREATED: 'registration.created',
};

export const eventBus = new EventEmitter();