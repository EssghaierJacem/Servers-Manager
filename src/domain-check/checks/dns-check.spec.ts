import { DomainDnsStatus } from '../../domains/entities/domain.entity';

const resolve4Mock = jest.fn();

jest.mock('dns', () => ({
  promises: {
    resolve4: (...args: unknown[]) => resolve4Mock(...args),
  },
}));

import { performDnsCheck } from './dns-check';

describe('performDnsCheck', () => {
  beforeEach(() => {
    resolve4Mock.mockReset();
  });

  it('marks the domain as resolving with the first returned address', async () => {
    resolve4Mock.mockResolvedValue(['203.0.113.10', '203.0.113.11']);

    const result = await performDnsCheck('example.com', 1000);

    expect(result.status).toBe(DomainDnsStatus.RESOLVING);
    expect(result.resolvedIp).toBe('203.0.113.10');
  });

  it('marks the domain as not_resolving when lookup fails', async () => {
    resolve4Mock.mockRejectedValue(new Error('ENOTFOUND example.invalid'));

    const result = await performDnsCheck('example.invalid', 1000);

    expect(result.status).toBe(DomainDnsStatus.NOT_RESOLVING);
    expect(result.resolvedIp).toBeNull();
    expect(result.rawOutput.error).toContain('ENOTFOUND');
  });
});
