import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { createTestApp, validEvent } from './helpers/testApp.mjs';

describe('event capacity', () => {
  let app;

  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  async function createEvent(capacity) {
    const res = await request(app).post('/api/events').send(validEvent({ capacity }));
    return res.body.id;
  }

  const register = (eventId, n) =>
    request(app)
      .post(`/api/events/${eventId}/registrations`)
      .send({ name: `Person ${n}`, email: `person${n}@example.com` });

  it('rejects a registration when the event is already full', async () => {
    const id = await createEvent(2);
    assert.equal((await register(id, 1)).status, 201);
    assert.equal((await register(id, 2)).status, 201);

    const third = await register(id, 3);
    assert.equal(third.status, 409);
    assert.equal(third.body.error.code, 'CONFLICT');
    assert.equal(third.body.error.message, 'Event is full');
  });

  it('reports 0 spots left after the last seat is taken', async () => {
    const id = await createEvent(1);
    await register(id, 1);

    const res = await request(app).get(`/api/events/${id}`);
    assert.equal(res.body.registered, 1);
    assert.equal(res.body.spotsLeft, 0);
  });
});