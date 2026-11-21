import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectNotifications, disconnectNotifications, toasts } from '../src/notifications.js';

class FakeEventSource {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.closed = false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  close() {
    this.closed = true;
  }

  // Pretends the server sent a message.
  emit(type, data) {
    this.listeners[type]({ data: JSON.stringify(data) });
  }
}

describe('notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    toasts.value = [];
    disconnectNotifications();
  });

  afterEach(() => {
    disconnectNotifications();
    vi.useRealTimers();
  });

  it('connects to the notification stream', () => {
    connectNotifications(FakeEventSource);
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0].url).toBe('/api/notifications/stream');
  });

  it('opens only one connection, even when called twice', () => {
    connectNotifications(FakeEventSource);
    connectNotifications(FakeEventSource);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('shows a toast when an event is created', () => {
    connectNotifications(FakeEventSource);
    FakeEventSource.instances[0].emit('event-created', { id: 7, title: 'Backend Bootcamp' });
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0].message).toBe('New event: Backend Bootcamp');
  });

  it('shows exactly one toast per registration and never a person', () => {
    connectNotifications(FakeEventSource);
    FakeEventSource.instances[0].emit('registration-created', {
      eventId: 7,
      title: 'Backend Bootcamp',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0].message).toBe('New registration for: Backend Bootcamp');
    expect(toasts.value[0].message).not.toMatch(/Ada|ada@/);
  });

  it('removes a toast after 5 seconds', () => {
    connectNotifications(FakeEventSource);
    FakeEventSource.instances[0].emit('event-created', { id: 7, title: 'Backend Bootcamp' });
    vi.advanceTimersByTime(5000);
    expect(toasts.value).toHaveLength(0);
  });

  it('closes the connection on disconnect', () => {
    connectNotifications(FakeEventSource);
    disconnectNotifications();
    expect(FakeEventSource.instances[0].closed).toBe(true);
  });
});