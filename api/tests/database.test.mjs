import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sequelize } from '../src/db/sequelize.mjs';

describe('database selection', () => {
  it('uses SQLite in tests', () => {
    assert.equal(sequelize.getDialect(), 'sqlite');
  });

  it('ignores DATABASE_URL in test mode so tests can never wipe a real database', async () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://user:pass@example.invalid:5432/db';
    try {
      // The "?fresh=1" makes Node load env.mjs again, so it re-reads process.env.
      const { env } = await import('../src/config/env.mjs?fresh=1');
      assert.equal(env.databaseUrl, undefined);
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  });
});