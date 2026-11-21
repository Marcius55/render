import assert from 'node:assert/strict';
import { once } from 'node:events';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { BusEvents, eventBus } from '../src/bus/eventBus.mjs';
import { createTestApp, validEvent } from './helpers/testApp.mjs';

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY).toISOString();

describe('MCP server', () => {
  let server;
  let port;
  let client;

  beforeEach(async () => {
    const { app } = await createTestApp();
    server = app.listen(0);
    await once(server, 'listening');
    port = server.address().port;
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/api/mcp`)));
  });

  afterEach(async () => {
    await client.close();
    server.closeAllConnections();
    server.close();
  });

  async function createEvent(overrides) {
    const res = await fetch(`http://127.0.0.1:${port}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validEvent(overrides)),
    });
    return res.json();
  }

  async function call(name, args = {}) {
    const result = await client.callTool({ name, arguments: args });
    return { isError: result.isError === true, text: result.content[0].text };
  }

  it('offers the three tools', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [
      'get_past_events',
      'get_upcoming_events',
      'register_for_event',
    ]);
  });

  it('lists only upcoming events with seats left', async () => {
    await createEvent({ title: 'Future event', startsAt: inDays(2), capacity: 5 });
    await createEvent({ title: 'Old event', startsAt: inDays(-2) });

    const result = await call('get_upcoming_events');
    assert.equal(result.isError, false);
    const events = JSON.parse(result.text);
    assert.deepEqual(events.map((event) => event.title), ['Future event']);
    assert.equal(events[0].spotsLeft, 5);
  });

  it('lists only past events', async () => {
    await createEvent({ title: 'Future event', startsAt: inDays(2) });
    await createEvent({ title: 'Old event', startsAt: inDays(-2) });

    const events = JSON.parse((await call('get_past_events')).text);
    assert.deepEqual(events.map((event) => event.title), ['Old event']);
  });

  it('registers a person, announces it once and never repeats who registered', async () => {
    const created = await createEvent({ title: 'Open Day', capacity: 3 });
    const announcements = [];
    const listener = (payload) => announcements.push(payload);
    eventBus.on(BusEvents.REGISTRATION_CREATED, listener);
    try {
      const result = await call('register_for_event', {
        eventId: created.id,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      });
      assert.equal(result.isError, false);
      assert.deepEqual(JSON.parse(result.text), { registered: true, event: 'Open Day', spotsLeft: 2 });
      assert.doesNotMatch(result.text, /Ada|ada@/);
      assert.deepEqual(announcements, [{ eventId: created.id, title: 'Open Day' }]);
    } finally {
      eventBus.off(BusEvents.REGISTRATION_CREATED, listener);
    }
  });

  it('reports a full event as a tool error', async () => {
    const created = await createEvent({ capacity: 1 });
    await call('register_for_event', { eventId: created.id, name: 'Ada Lovelace', email: 'ada@example.com' });
    const result = await call('register_for_event', {
      eventId: created.id,
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });
    assert.equal(result.isError, true);
    assert.match(result.text, /full/);
  });

  it('reports duplicates, unknown events and invalid emails as tool errors', async () => {
    const created = await createEvent({ capacity: 5 });
    const person = { eventId: created.id, name: 'Ada Lovelace', email: 'ada@example.com' };
    await call('register_for_event', person);

    const duplicate = await call('register_for_event', person);
    assert.equal(duplicate.isError, true);
    assert.match(duplicate.text, /already registered/);

    const unknown = await call('register_for_event', { ...person, eventId: 9999 });
    assert.equal(unknown.isError, true);
    assert.match(unknown.text, /not found/);

    const invalid = await call('register_for_event', { ...person, email: 'not-an-email' });
    assert.equal(invalid.isError, true);
  });
});