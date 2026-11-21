import assert from 'node:assert/strict';
import { once } from 'node:events';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestApp } from './helpers/testApp.mjs';

describe('notification stream CORS', () => {
  let server;
  let controller;

  beforeEach(async () => {
    const { app } = await createTestApp();
    server = app.listen(0);
    await once(server, 'listening');
    controller = new AbortController();
  });

  afterEach(() => {
    controller.abort();
    server.closeAllConnections();
    server.close();
  });

  it('lets a page on another address read the stream', async () => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/notifications/stream`, {
      signal: controller.signal,
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });
});