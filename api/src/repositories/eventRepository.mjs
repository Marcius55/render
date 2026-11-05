import { Event } from '../models/index.mjs';

export const eventRepository = {
  findAllOrderedByStart() {
    return Event.findAll({ order: [['startsAt', 'ASC']] });
  },

  findAll() {
    return Event.findAll();
  },

  findById(id) {
    return Event.findByPk(id);
  },

  create(data) {
    return Event.create(data);
  },

  update(event, data) {
    return event.update(data);
  },

  deleteById(id) {
    return Event.destroy({ where: { id } });
  }
};