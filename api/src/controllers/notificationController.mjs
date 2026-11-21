import { eventBus, BusEvents } from '../bus/eventBus.mjs';

// Every open browser tab = one response object we keep writing to.
const clients = new Set();

function broadcast(type, data) {
  const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(message);
  }
}

eventBus.on(BusEvents.EVENT_CREATED, (payload) => broadcast('event-created', payload));
eventBus.on(BusEvents.REGISTRATION_CREATED, (payload) => broadcast('registration-created', payload));

// A comment line (starts with ":") is ignored by the browser, but keeps the
// connection from being closed as "idle" by proxies like Render's.
const heartbeat = setInterval(() => {
  for (const res of clients) {
    res.write(': ping\n\n');
  }
}, 25000);
heartbeat.unref();

export const notificationController = {
  stream(req, res) {
    res.status(200).set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    res.write(': connected\n\n');

    clients.add(res);
    req.on('close', () => clients.delete(res));
  },
};