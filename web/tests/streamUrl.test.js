import { describe, expect, it } from 'vitest';
import { buildStreamUrl } from '../src/notifications.js';

describe('buildStreamUrl', () => {
  it('uses a relative address when no API address is configured', () => {
    expect(buildStreamUrl()).toBe('/api/notifications/stream');
  });

  it('uses the configured API address', () => {
    expect(buildStreamUrl('https://campus-api-events.onrender.com')).toBe(
      'https://campus-api-events.onrender.com/api/notifications/stream',
    );
  });

  it('ignores a trailing slash', () => {
    expect(buildStreamUrl('https://campus-api-events.onrender.com/')).toBe(
      'https://campus-api-events.onrender.com/api/notifications/stream',
    );
  });
});