import { registrationService } from '../services/registrationService.mjs';

export const registrationController = {
  async list(req, res) {
    res.json(await registrationService.listForEvent(req.validated.params.id));
  },

  async register(req, res) {
    const registration = await registrationService.register(req.validated.params.id, req.validated.body);
    res.status(201).json(registration);
  }
};