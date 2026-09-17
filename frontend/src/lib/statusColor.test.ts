import { describe, expect, it } from 'vitest';
import { getStatusColorKey } from './statusColor';

describe('getStatusColorKey', () => {
  it.each(['healthy', 'running', 'valid', 'resolving', 'sent'])(
    'maps "%s" to healthy',
    (status) => {
      expect(getStatusColorKey(status)).toBe('healthy');
    },
  );

  it.each(['degraded', 'expiring_soon'])('maps "%s" to warning', (status) => {
    expect(getStatusColorKey(status)).toBe('warning');
  });

  it.each([
    'unreachable',
    'crash_loop',
    'unhealthy',
    'expired',
    'invalid',
    'failed',
    'not_resolving',
  ])('maps "%s" to critical', (status) => {
    expect(getStatusColorKey(status)).toBe('critical');
  });

  it.each(['unknown', 'stopped', 'pending'])('maps "%s" to unknown', (status) => {
    expect(getStatusColorKey(status)).toBe('unknown');
  });

  it('treats "stopped" as a neutral state, never critical', () => {
    expect(getStatusColorKey('stopped')).not.toBe('critical');
  });

  it('falls back to unknown for an unrecognized status', () => {
    expect(getStatusColorKey('some-future-status')).toBe('unknown');
  });
});
