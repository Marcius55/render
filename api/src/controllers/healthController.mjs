import { sequelize } from '../db/sequelize.mjs';

export const healthController = {
  async check(req, res) {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ok' });
  }
};