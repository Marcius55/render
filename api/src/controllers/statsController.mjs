import { statsService } from '../services/statsService.mjs';

export const statsController = {
  async get(req, res) {
    res.json(await statsService.getStats());
  }
};