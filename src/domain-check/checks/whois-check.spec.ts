const whoisMock = jest.fn();

jest.mock('whois-json', () => ({
  __esModule: true,
  default: (...args: unknown[]) => whoisMock(...args),
}));

import { performWhoisLookup } from './whois-check';

describe('performWhoisLookup', () => {
  beforeEach(() => {
    whoisMock.mockReset();
  });

  it('extracts registrar and expiry date from a common field-name shape', async () => {
    whoisMock.mockResolvedValue({
      registrar: 'Example Registrar, Inc.',
      registryExpiryDate: '2030-01-01T00:00:00Z',
    });

    const result = await performWhoisLookup('example.com', 1000);

    expect(result.ok).toBe(true);
    expect(result.registrar).toBe('Example Registrar, Inc.');
    expect(result.expiresAt?.toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('falls back through alternate field names case-insensitively', async () => {
    whoisMock.mockResolvedValue({
      SponsoringRegistrar: 'Alt Registrar',
      ExpirationDate: '2031-06-15',
    });

    const result = await performWhoisLookup('example.net', 1000);

    expect(result.registrar).toBe('Alt Registrar');
    expect(result.expiresAt).not.toBeNull();
  });

  it('reports failure without throwing when the lookup errors or times out', async () => {
    whoisMock.mockRejectedValue(new Error('WHOIS server refused connection'));

    const result = await performWhoisLookup('example.org', 1000);

    expect(result.ok).toBe(false);
    expect(result.registrar).toBeNull();
    expect(result.expiresAt).toBeNull();
    expect(result.rawOutput.error).toContain('refused');
  });
});
