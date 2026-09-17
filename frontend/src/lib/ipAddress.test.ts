import { describe, expect, it } from 'vitest';
import { isPlausibleIpAddress } from './ipAddress';

describe('isPlausibleIpAddress', () => {
  it.each(['203.0.113.10', '10.0.0.1', '255.255.255.255', '0.0.0.0'])(
    'accepts valid IPv4 "%s"',
    (value) => {
      expect(isPlausibleIpAddress(value)).toBe(true);
    },
  );

  it.each(['::1', '2001:db8::1', 'fe80::1ff:fe23:4567:890a'])(
    'accepts plausible IPv6 "%s"',
    (value) => {
      expect(isPlausibleIpAddress(value)).toBe(true);
    },
  );

  it.each(['256.1.1.1', '1.2.3', '1.2.3.4.5', 'not-an-ip', '', '  '])(
    'rejects malformed input "%s"',
    (value) => {
      expect(isPlausibleIpAddress(value)).toBe(false);
    },
  );
});
