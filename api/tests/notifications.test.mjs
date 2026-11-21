import assert from 'node:assert/strict';
import { once } from 'node:events';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestApp, validEvent } from './helpers/testApp.mjs';

describe('notification stream (SSE)', () => {
  let server;
  let port;
  let clients;

  beforeEach(async () => {
    const { app } = await createTestApp();
    server = app.listen(0); // port 0 = let the OS pick a free port
    await once(server, 'listening');
    port = server.address().port;
    clients = [];
  });

  afterEach(() => {
    clients.forEach((client) => client.close());
    server.closeAllConnections();
    server.close();
  });

  // Opens the stream like a browser tab would and keeps collecting its text.
  async function openStream() {
    const controller = new AbortController();
    const res = await fetch(`http://127.0.0.1:${port}/api/notifications/stream`, {
      signal: controller.signal,
    });
    const client = { res, text: '', close: () => controller.abort() };
    const decoder = new TextDecoder();
    (async () => {
      try {
        for await (const chunk of res.body) client.text += decoder.decode(chunk, { stream: true });
      } catch {
        // the stream is aborted when the test ends
      }
    })();
    clients.push(client);
    return client;
  }

  async function waitFor(client, fragment, count = 1) {
    for (let i = 0; i < 50; i += 1) {
      if (client.text.split(fragment).length - 1 >= count) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Never received "${fragment}". Got: ${client.text}`);
  }

  const post = (path, body) =>
    fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('opens an event stream', async () => {
    const client = await openStream();
    assert.equal(client.res.status, 200);
    assert.match(client.res.headers.get('content-type'), /text\/event-stream/);
  });

  it('sends a created event to every open browser', async () => {
    const tabA = await openStream();
    const tabB = await openStream();

    const res = await post('/events', validEvent());
    assert.equal(res.status, 201);

    await waitFor(tabA, 'event: event-created');
    await waitFor(tabB, 'event: event-created');
    assert.match(tabA.text, /"title":"Backend Bootcamp"/);
  });

  it('sends exactly one registration message and never the registrant', async () => {
    const tab = await openStream();
    const created = await (await post('/events', validEvent())).json();

    const res = await post(`/events/${created.id}/registrations`, {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    assert.equal(res.status, 201);

    // A second event acts as a marker: once it arrives, everything before it has arrived too.
    await post('/events', validEvent({ title: 'Marker event' }));
    await waitFor(tab, 'event: event-created', 2);

    assert.equal(tab.text.split('event: registration-created').length - 1, 1);
    assert.doesNotMatch(tab.text, /Ada/);
    assert.doesNotMatch(tab.text, /ada@example\.com/);
  });
});