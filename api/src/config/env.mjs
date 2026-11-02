if (process.env.NODE_ENV !== 'test') {
      try {
    process.loadEnvFile();
      } catch {
    // no .env
  }
}

export const env = {
      nodeEnv: process.env.NODE_ENV,
  isTest: process.env.NODE_ENV === 'test',
    logLevel: process.env.LOG_LEVEL || 'info',
  dbStorage: process.env.DB_STORAGE || './data/events.sqlite'
};