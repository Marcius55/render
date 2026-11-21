import { Sequelize } from 'sequelize';
import { env } from '../config/env.mjs';

export const sequelize = env.databaseUrl
  ? new Sequelize(env.databaseUrl, { dialect: 'postgres', logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: env.dbStorage, logging: false });