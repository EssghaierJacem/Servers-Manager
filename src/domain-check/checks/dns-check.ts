import { promises as dns } from 'dns';
import { withTimeout } from '../../common/utils/with-timeout';
import { DomainDnsStatus } from '../../domains/entities/domain.entity';

export interface DnsCheckResult {
  status: DomainDnsStatus;
  resolvedIp: string | null;
  rawOutput: Record<string, unknown>;
}

export async function performDnsCheck(
  hostname: string,
  timeoutMs: number,
): Promise<DnsCheckResult> {
  try {
    const addresses = await withTimeout(
      dns.resolve4(hostname),
      timeoutMs,
      `DNS resolve(${hostname})`,
    );
    return {
      status: DomainDnsStatus.RESOLVING,
      resolvedIp: addresses[0] ?? null,
      rawOutput: { addresses },
    };
  } catch (error) {
    return {
      status: DomainDnsStatus.NOT_RESOLVING,
      resolvedIp: null,
      rawOutput: { error: (error as Error).message },
    };
  }
}
