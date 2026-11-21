import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { BusEvents, eventBus } from '../src/bus/eventBus.mjs';
import { createTestApp, validEvent } from './helpers/testApp.mjs';

describe('event bus announcements', () => {
  let app;
  let received;

  const onCreated = (payload) => received.push({ type: BusEvents.EVENT_CREATED, payload });
  const onRegistered = (payload) => received.push({ type: BusEvents.REGISTRATION_CREATED, payload });

  beforeEach(async () => {
    ({ app } = await createTestApp());
    received = [];
    eventBus.on(BusEvents.EVENT_CREATED, onCreated);
    eventBus.on(BusEvents.REGISTRATION_CREATED, onRegistered);
  });

  afterEach(() => {
    eventBus.off(BusEvents.EVENT_CREATED, onCreated);
    eventBus.off(BusEvents.REGISTRATION_CREATED, onRegistered);
  });

  it('announces a created event with only id and title', async () => {
    const res = await request(app).post('/api/events').send(validEvent());
    assert.equal(res.status, 201);
    assert.deepEqual(received, [
      { type: BusEvents.EVENT_CREATED, payload: { id: res.body.id, title: 'Backend Bootcamp' } },
    ]);
  });

  it('announces a registration without any personal data', async () => {
    const created = await request(app).post('/api/events').send(validEvent());
    received = [];
    const res = await request(app)
      .post(`/api/events/${created.body.id}/registrations`)
      .send({ name: 'Ada Lovelace', email: 'ada@example.com' });
    assert.equal(res.status, 201);
    assert.deepEqual(received, [
      { type: BusEvents.REGISTRATION_CREATED, payload: { eventId: created.body.id, title: 'Backend Bootcamp' } },
    ]);
  });

  it('does not announce a duplicate registration', async () => {
    const created = await request(app).post('/api/events').send(validEvent());
    const url = `/api/events/${created.body.id}/registrations`;
    const body = { name: 'Ada Lovelace', email: 'ada@example.com' };
    await request(app).post(url).send(body);
    const second = await request(app).post(url).send(body);
    assert.equal(second.status, 409);
    const registrations = received.filter((r) => r.type === BusEvents.REGISTRATION_CREATED);
    assert.equal(registrations.length, 1);
  });
});