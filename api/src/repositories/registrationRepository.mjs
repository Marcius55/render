import { Registration } from '../models/index.mjs';

export const registrationRepository = {
  countByEvent(eventId) {
    return Registration.count({ where: { eventId } });
  },

  findAllByEvent(eventId) {
    return Registration.findAll({ where: { eventId }, order: [['createdAt', 'ASC']] });
  },

  findByEventAndEmail(eventId, email) {
    return Registration.findOne({ where: { eventId, email } });
  },

  create(data) {
    return Registration.create(data);
  }
};