import { eventService } from '../services/eventService.mjs';

export const eventController = {
  async list(req, res) {
    res.json(await eventService.list());
  },

  async getOne(req, res) {
    res.status(200).json(await eventService.getWithCounts(req.validated.params.id));
  },

  async create(req, res) {
    const event = await eventService.create(req.validated.body);
    res.status(201).location('/api/events/' + event.id).json(event);
  },

  async update(req, res) {
    res.status(200).json(await eventService.update(req.validated.params.id, req.validated.body));
  },

  async remove(req, res) {
    await eventService.remove(req.validated.params.id);
    res.status(204).send();
  }
};